import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Diagnostics, type ExtensionManifest, type RegistryEntry } from '@kubb/core'
import { x } from 'tinyexec'

export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun'

/** Metadata describing a package manager's lock file and commands. */
export type PackageManagerInfo = {
  /** Identifier used in CLI commands, e.g. `pnpm`, `yarn`. */
  name: PackageManagerName
  /** Lock file names that identify this package manager in a project root. */
  lockFiles: ReadonlyArray<string>
  /** Subcommands passed to the package manager binary to create a `package.json`. */
  initCommand: ReadonlyArray<string>
  /** Subcommands passed to the package manager binary to install a dev dependency. */
  installCommand: ReadonlyArray<string>
  /** Subcommands passed to the package manager binary before a `package.json` script name. */
  runCommand: ReadonlyArray<string>
}

/** Metadata for each supported package manager, keyed by its short name. */
export const packageManagers: Record<PackageManagerName, PackageManagerInfo> = {
  pnpm: {
    name: 'pnpm',
    lockFiles: ['pnpm-lock.yaml'],
    initCommand: ['init'],
    installCommand: ['add', '-D'],
    runCommand: [],
  },
  yarn: {
    name: 'yarn',
    lockFiles: ['yarn.lock'],
    initCommand: ['init', '-y'],
    installCommand: ['add', '-D'],
    runCommand: [],
  },
  bun: {
    name: 'bun',
    lockFiles: ['bun.lock', 'bun.lockb'],
    initCommand: ['init', '-y'],
    installCommand: ['add', '-d'],
    runCommand: ['run'],
  },
  npm: {
    name: 'npm',
    lockFiles: ['package-lock.json'],
    initCommand: ['init', '-y'],
    installCommand: ['install', '--save-dev'],
    runCommand: ['run'],
  },
}

/** Minimal shape of `package.json` fields read during detection. */
type PackageJson = {
  /** The `packageManager` field from `package.json` (e.g. `"pnpm@9.0.0"`). */
  packageManager?: string
  scripts?: Record<string, string>
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/** Detects the package manager for `cwd`: the `packageManager` field in `package.json`, then a lock file, then `npm`. */
export function detectPackageManager(cwd: string = process.cwd()): PackageManagerInfo {
  const packageJsonPath = path.join(cwd, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson
      const pmField = packageJson.packageManager
      if (typeof pmField === 'string') {
        const name = pmField.split('@')[0]
        if (name && name in packageManagers) {
          return packageManagers[name as PackageManagerName]
        }
      }
    } catch {
      // Continue to lock file detection
    }
  }

  for (const pm of Object.values(packageManagers)) {
    if (pm.lockFiles.some((lockFile) => fs.existsSync(path.join(cwd, lockFile)))) {
      return pm
    }
  }

  return packageManagers.npm
}

/**
 * Initializes a new `package.json` at `cwd` using the detected package manager.
 */
export async function initPackageJson(cwd: string, packageManager: PackageManagerInfo): Promise<void> {
  await x(packageManager.name, [...packageManager.initCommand], {
    nodeOptions: { cwd, stdio: 'inherit' },
    throwOnError: true,
  })
}

/** How many trailing lines of a failed install's output the error keeps. */
const INSTALL_OUTPUT_LINES = 20

/**
 * Installs the given packages at `cwd` using the detected package manager. Its output is captured,
 * since a spinner owns the line while it runs, and only a failed install shows it, in the error.
 */
export async function installPackages(packages: Array<string>, packageManager: PackageManagerInfo, cwd: string = process.cwd()): Promise<void> {
  const args = [...packageManager.installCommand, ...packages]
  const result = await x(packageManager.name, args, { nodeOptions: { cwd }, throwOnError: false })
  if (result.exitCode === 0) return

  const output = `${result.stdout}\n${result.stderr}`.trim().split('\n').slice(-INSTALL_OUTPUT_LINES).join('\n')
  throw new Error(`\`${packageManager.name} ${args.join(' ')}\` failed with exit code ${result.exitCode}${output ? `:\n${output}` : ''}`)
}

/**
 * What the installed manifests of the `selected` plugins say is missing from the selection: a
 * `dependencies` entry, or a `client` plugin next to a `consumer`. Empty when nothing is missing.
 * `optionalDependencies` are skipped, since `kubb init` writes the default options.
 */
export function missingPluginDependencies({ selected, manifests }: { selected: Array<string>; manifests: Array<ExtensionManifest> }): Array<string> {
  const hasClient = manifests.some((manifest) => manifest.role === 'client')
  return manifests.flatMap((manifest) => [
    ...(manifest.dependencies ?? []).filter((name) => !selected.includes(name)).map((name) => `${manifest.name} needs ${name}.`),
    ...(manifest.role === 'consumer' && !hasClient ? [`${manifest.name} needs a client plugin, such as plugin-axios or plugin-fetch.`] : []),
  ])
}

async function readPackageJson(cwd: string): Promise<PackageJson> {
  try {
    return JSON.parse(await fs.promises.readFile(path.join(cwd, 'package.json'), 'utf-8')) as PackageJson
  } catch {
    return {}
  }
}

/** Frameworks and data libraries named in the detection line, keyed by package name. */
const libraries: Record<string, string> = {
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  'solid-js': 'Solid',
  '@tanstack/react-query': 'TanStack Query',
  '@tanstack/vue-query': 'TanStack Query',
  '@tanstack/svelte-query': 'TanStack Query',
  '@tanstack/solid-query': 'TanStack Query',
  swr: 'SWR',
  axios: 'axios',
  zod: 'Zod',
  msw: 'MSW',
  '@faker-js/faker': 'Faker',
  cypress: 'Cypress',
}

const FRAMEWORKS = ['react', 'vue', 'svelte', 'solid-js']

/** What `kubb init` found in the project at `cwd`. */
export type ProjectInfo = {
  typescript: boolean
  /** Every `dependencies` and `devDependencies` entry with its version range. */
  dependencies: Record<string, string>
  /** Readable names for the detection line, such as `['React 19', 'TanStack Query']`. */
  labels: Array<string>
}

/** Reads `package.json` and checks for `tsconfig.json` at `cwd`, in parallel, for TypeScript, the framework, and the data libraries. */
export async function detectProject(cwd: string): Promise<ProjectInfo> {
  const [packageJson, hasTsconfig] = await Promise.all([
    readPackageJson(cwd),
    fs.promises.access(path.join(cwd, 'tsconfig.json')).then(
      () => true,
      () => false,
    ),
  ])
  const dependencies = { ...packageJson.devDependencies, ...packageJson.dependencies }
  const typescript = hasTsconfig || 'typescript' in dependencies
  const found = Object.entries(libraries).flatMap(([name, label]) => {
    const range = dependencies[name]
    if (range === undefined) return []
    const major = FRAMEWORKS.includes(name) ? range.match(/\d+/)?.[0] : undefined
    return [major ? `${label} ${major}` : label]
  })
  return { typescript, dependencies, labels: [...(typescript ? ['TypeScript'] : []), ...new Set(found)] }
}

const SPEC_FILE = /^(openapi|swagger)[\w.-]*\.(ya?ml|json)$/i
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage'])

/**
 * Finds OpenAPI spec files up to `depth` folders below `cwd`, shallowest first, as `./`-relative
 * paths. Walks one level at a time and stops after `limit` files, so a large repo stays fast.
 */
export async function findSpecFiles(cwd: string, { depth = 3, limit = 20 }: { depth?: number; limit?: number } = {}): Promise<Array<string>> {
  const found: Array<string> = []
  let level: Array<string> = ['']
  for (let current = 0; current <= depth && level.length && found.length < limit; current++) {
    const listings = await Promise.all(
      level.map(async (dir) => ({ dir, entries: await fs.promises.readdir(path.join(cwd, dir), { withFileTypes: true }).catch(() => []) })),
    )
    level = []
    for (const { dir, entries } of listings) {
      for (const entry of entries.toSorted((a, b) => a.name.localeCompare(b.name))) {
        if (entry.isFile() && SPEC_FILE.test(entry.name)) found.push(`./${path.posix.join(dir, entry.name)}`)
        if (entry.isDirectory() && !entry.name.startsWith('.') && !SKIPPED_DIRS.has(entry.name)) level.push(path.posix.join(dir, entry.name))
      }
    }
  }
  return found.slice(0, limit)
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

/** Plugins to pre-select when the project depends on a package, keyed by package name. */
const pluginsByDependency: Record<string, string> = {
  '@tanstack/react-query': 'plugin-react-query',
  '@tanstack/vue-query': 'plugin-vue-query',
  swr: 'plugin-swr',
  zod: 'plugin-zod',
  msw: 'plugin-msw',
  axios: 'plugin-axios',
  '@faker-js/faker': 'plugin-faker',
  cypress: 'plugin-cypress',
}

/**
 * The plugins to pre-select for a project with `dependencies`, each with the reason: `plugin-ts`,
 * one per matching dependency, the plugins those need, and `plugin-fetch` for a consumer without a client.
 */
export function recommendPlugins({ plugins, dependencies }: { plugins: Array<RegistryEntry>; dependencies: Record<string, string> }): Map<string, string> {
  const byName = new Map(plugins.map((entry) => [entry.manifest.name, entry]))
  const reasons = new Map<string, string>([['plugin-ts', 'always useful']])
  for (const [dependency, name] of Object.entries(pluginsByDependency)) {
    if (dependency in dependencies) reasons.set(name, `uses ${dependency}`)
  }
  for (const name of reasons.keys()) {
    for (const needed of byName.get(name)?.manifest.dependencies ?? []) {
      if (!reasons.has(needed)) reasons.set(needed, `needed by ${name}`)
    }
  }
  const selected = [...reasons.keys()].flatMap((name) => byName.get(name) ?? [])
  const consumer = selected.find((entry) => entry.manifest.role === 'consumer')
  if (consumer && !selected.some((entry) => entry.manifest.role === 'client')) reasons.set('plugin-fetch', `client for ${consumer.manifest.name}`)
  return new Map([...reasons].filter(([name]) => byName.has(name)))
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
  const source = await fs.promises.readFile(file, 'utf-8')
  const packageJson = JSON.parse(source) as PackageJson
  if (packageJson.scripts?.generate !== undefined) return false
  const indent = source.match(/^[ \t]+/m)?.[0] ?? '  '
  const updated = { ...packageJson, scripts: { ...packageJson.scripts, generate: 'kubb generate' } }
  await fs.promises.writeFile(file, `${JSON.stringify(updated, null, indent)}\n`, 'utf-8')
  return true
}

/** Reads the `generate` script from the `package.json` at `cwd`. */
export async function generateScript(cwd: string): Promise<string | undefined> {
  return (await readPackageJson(cwd)).scripts?.generate
}
