import fs from 'node:fs'
import { glob } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { read, toPosixPath, write } from '@internals/utils'
import { Diagnostics, type ExtensionManifest, type RegistryEntry } from '@kubb/core'
import { type Agent, type AgentName, detect, resolveCommand } from 'package-manager-detector'
import { x } from 'tinyexec'

export type PackageManagerName = Extract<AgentName, 'npm' | 'pnpm' | 'yarn' | 'bun'>

/**
 * A project's package manager: `name` for messages, `agent` for `resolveCommand`.
 */
export type PackageManagerInfo = { name: PackageManagerName; agent: Agent }

/**
 * Subcommands that create a `package.json`; `package-manager-detector` has no `init` command.
 */
const initCommands: Record<PackageManagerName, ReadonlyArray<string>> = { npm: ['init', '-y'], pnpm: ['init'], yarn: ['init', '-y'], bun: ['init', '-y'] }

/** Minimal shape of `package.json` fields read during detection. */
type PackageJson = {
  /** The `packageManager` field from `package.json` (e.g. `"pnpm@9.0.0"`). */
  packageManager?: string
  scripts?: Record<string, string>
}

/**
 * Detects the package manager in `cwd`: the `packageManager` field in `package.json`, then a lock file, then `npm`. Parent folders are not searched.
 */
export async function detectPackageManager(cwd: string = process.cwd()): Promise<PackageManagerInfo> {
  const found = await detect({ cwd, stopDir: cwd, strategies: ['packageManager-field', 'lockfile'] })
  return found && found.name in initCommands ? (found as PackageManagerInfo) : { name: 'npm', agent: 'npm' }
}

/**
 * Initializes a new `package.json` at `cwd` using the detected package manager.
 */
export async function initPackageJson(cwd: string, packageManager: PackageManagerInfo): Promise<void> {
  await x(packageManager.name, [...initCommands[packageManager.name]], {
    nodeOptions: { cwd, stdio: 'inherit' },
    throwOnError: true,
  })
}

/** How many trailing lines of a failed install's output the error keeps. */
const INSTALL_OUTPUT_LINES = 20
const INSTALL_TIMEOUT_MS = 5 * 60_000

/**
 * Installs the given packages at `cwd` using the detected package manager. Each output line goes
 * to `onLine`, so the caller can show it while the install runs; a failed install also keeps the
 * end of the output in the error.
 */
export async function installPackages(
  packages: Array<string>,
  packageManager: PackageManagerInfo,
  cwd: string = process.cwd(),
  onLine?: (line: string) => void,
  command: 'add' | 'uninstall' = 'add',
): Promise<void> {
  const { command: bin, args } = resolveCommand(packageManager.agent, command, command === 'add' ? ['-D', ...packages] : packages)!
  // No stdin, so a package manager that wants input fails instead of waiting. The timeout ends a stalled install.
  const result = x(bin, args, {
    nodeOptions: { cwd, stdio: ['ignore', 'pipe', 'pipe'] },
    timeout: INSTALL_TIMEOUT_MS,
    throwOnError: false,
  })
  const lines: Array<string> = []
  for await (const line of result) {
    lines.push(line)
    onLine?.(line)
  }
  if (result.exitCode === 0) return
  if (result.exitCode === undefined) throw new Error(`\`${bin} ${args.join(' ')}\` timed out after ${INSTALL_TIMEOUT_MS / 60_000} minutes`)

  const output = lines.slice(-INSTALL_OUTPUT_LINES).join('\n')
  throw new Error(`\`${bin} ${args.join(' ')}\` failed with exit code ${result.exitCode}${output ? `:\n${output}` : ''}`)
}

/**
 * Uninstalls the given packages at `cwd` with the package manager's remove command, like {@link installPackages}.
 */
export function uninstallPackages(packages: Array<string>, packageManager: PackageManagerInfo, cwd: string = process.cwd()): Promise<void> {
  return installPackages(packages, packageManager, cwd, undefined, 'uninstall')
}

/**
 * What the selected plugins' `manifests` say is missing from the selection: a `dependencies`
 * entry, or a `client` plugin next to a `consumer`. Empty when nothing is missing.
 * `optionalDependencies` are skipped, since `kubb init` writes the default options.
 */
export function missingPluginDependencies(manifests: Array<ExtensionManifest>): Array<string> {
  const selected = manifests.map((manifest) => manifest.name)
  const hasClient = manifests.some((manifest) => manifest.role === 'client')
  return manifests.flatMap((manifest) => [
    ...(manifest.dependencies ?? []).filter((name) => !selected.includes(name)).map((name) => `${manifest.name} needs ${name}.`),
    ...(manifest.role === 'consumer' && !hasClient ? [`${manifest.name} needs a client plugin, such as plugin-axios or plugin-fetch.`] : []),
  ])
}

async function readPackageJson(cwd: string): Promise<PackageJson> {
  try {
    return JSON.parse(await read(path.join(cwd, 'package.json'))) as PackageJson
  } catch {
    return {}
  }
}

const SPEC_FILE = /^(openapi|swagger)[\w.-]*\.(ya?ml|json)$/i
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage'])

/**
 * Finds OpenAPI spec files up to `depth` folders below `cwd`, shallowest first, as `./`-relative
 * paths. Skips hidden and build folders without walking them and returns at most `limit` files.
 */
export async function findSpecFiles(cwd: string, { depth = 3, limit = 20 }: { depth?: number; limit?: number } = {}): Promise<Array<string>> {
  const found: Array<string> = []
  const pattern = `{${Array.from({ length: depth + 1 }, (_, level) => '*/'.repeat(level)).join(',')}}*`
  // The extension stays out of the pattern so SPEC_FILE matches it case-insensitively. Dot folders are skipped by default.
  const files = glob(pattern, { cwd, exclude: (file) => file.split(path.sep).some((segment) => SKIPPED_DIRS.has(segment)) })
  for await (const file of files) if (SPEC_FILE.test(path.basename(file))) found.push(toPosixPath(file))
  return found
    .toSorted((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b))
    .slice(0, limit)
    .map((file) => `./${file}`)
}

/** The spec version and operation count, when the file states them. */
export type SpecInfo = { version?: string; operations?: number }

const SPEC_HEAD_BYTES = 256 * 1024
const METHOD = '(?:get|put|post|delete|options|head|patch|trace)'

/**
 * Reads the OpenAPI or Swagger version and counts the operations from the first 256 KB of the
 * file, so a large spec is never parsed. The count is left out when the file is longer.
 */
export async function readSpecInfo(file: string): Promise<SpecInfo> {
  const handle = await fs.promises.open(file)
  try {
    const buffer = Buffer.alloc(SPEC_HEAD_BYTES)
    const { bytesRead } = await handle.read(buffer, 0, SPEC_HEAD_BYTES, 0)
    const head = buffer.toString('utf-8', 0, bytesRead)
    const complete = bytesRead < SPEC_HEAD_BYTES
    const version = head.match(/^\s*["']?(?:openapi|swagger)["']?\s*:\s*["']?(\d[\d.]*)/m)?.[1]
    // shortcut: counts method keys at any depth, so a schema property named `get` counts too; use the adapter when that matters.
    const methods = new RegExp(`^\\s*["']?${METHOD}["']?\\s*:\\s*(?:\\{|$)`, 'gm')
    return { version, operations: complete ? (head.match(methods)?.length ?? 0) : undefined }
  } finally {
    await handle.close()
  }
}

/** Finds a plugin by registry id, slug, or short name, so `ts`, `plugin-ts`, and `kubb-labs/plugin-ts` all match. */
export function findPlugin({ plugins, id }: { plugins: Array<RegistryEntry>; id: string }): RegistryEntry | undefined {
  const ids = id.includes('/') ? [id] : [`kubb-labs/${id}`, `kubb-labs/plugin-${id}`]
  return plugins.find((entry) => ids.includes(entry.id))
}

/**
 * Turns the comma-separated `--plugins` value into registry entries.
 *
 * @throws when an id is not in `plugins`.
 */
export function parsePluginsFlag({ plugins, value }: { plugins: Array<RegistryEntry>; value: string }): Array<RegistryEntry> {
  const ids = value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  const unknown = ids.filter((id) => !findPlugin({ plugins, id }))
  if (unknown.length)
    throw new Diagnostics.Error({
      code: Diagnostics.code.pluginNotFound,
      severity: 'error',
      message: `Not in the Kubb registry: ${unknown.join(', ')}. Browse the plugins at https://kubb.dev/extensions.`,
      help: 'Use plugin ids from https://kubb.dev/extensions, such as plugin-ts or ts.',
    })
  return ids.map((id) => findPlugin({ plugins, id })!)
}

/** Adds `"generate": "kubb generate"` to the `package.json` scripts at `cwd`. Returns `false`, and changes nothing, when a `generate` script exists. */
export async function addGenerateScript(cwd: string): Promise<boolean> {
  const file = path.join(cwd, 'package.json')
  const source = await read(file)
  const packageJson = JSON.parse(source) as PackageJson
  if (packageJson.scripts?.generate !== undefined) return false
  const indent = source.match(/^[ \t]+/m)?.[0] ?? '  '
  const updated = { ...packageJson, scripts: { ...packageJson.scripts, generate: 'kubb generate' } }
  await write(file, JSON.stringify(updated, null, indent))
  return true
}

/** Reads the `generate` script from the `package.json` at `cwd`. */
export async function generateScript(cwd: string): Promise<string | undefined> {
  return (await readPackageJson(cwd)).scripts?.generate
}
