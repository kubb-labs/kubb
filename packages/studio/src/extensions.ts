import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { isExtensionManifest, isPackageName } from '@kubb/core'
import type { ExtensionEntry } from './protocol.ts'

/**
 * The extension packages installed in a project, keyed by package name. Only these, besides
 * `@kubb/plugin-*` packages, may be imported on behalf of Studio.
 */
export type InstalledExtensions = ReadonlyMap<string, ExtensionEntry>

/** Extensions `kubb` ships with, so they count as installed without being a direct dependency. */
const BUILT_IN_PACKAGES = ['@kubb/adapter-oas', '@kubb/parser-ts', '@kubb/parser-md', '@kubb/plugin-barrel']

async function readJSON(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, 'utf8')) as unknown
}

function dependencyNames(packageJSON: unknown): Array<string> {
  if (typeof packageJSON !== 'object' || packageJSON === null) return []
  const { dependencies, devDependencies } = packageJSON as Record<string, unknown>
  return [dependencies, devDependencies].flatMap((record) => (typeof record === 'object' && record !== null ? Object.keys(record) : []))
}

function packageDir(require: NodeRequire, packageName: string): string | undefined {
  for (const file of ['kubb-extension.json', 'package.json']) {
    try {
      return path.dirname(require.resolve(`${packageName}/${file}`))
    } catch {
      // Not exported or not installed, try the next file.
    }
  }
  return undefined
}

/** Reads `<packageName>/kubb-extension.json`, or `undefined` when it is missing or invalid. */
async function readExtension(requires: Array<NodeRequire>, packageName: string): Promise<ExtensionEntry | undefined> {
  const dir = requires.map((require) => packageDir(require, packageName)).find((found) => found !== undefined)
  if (!dir) return undefined

  try {
    const [manifest, packageJSON] = await Promise.all([readJSON(path.join(dir, 'kubb-extension.json')), readJSON(path.join(dir, 'package.json'))])
    const version = (packageJSON as { version?: unknown } | null)?.version
    if (!isExtensionManifest(manifest) || typeof version !== 'string') return undefined

    return { package: packageName, version, manifest }
  } catch {
    return undefined
  }
}

/**
 * Finds the extensions installed in the project at `root`: its `dependencies` and `devDependencies`,
 * the `packages` its config file imports, and the extensions `kubb` ships with. Keeps each package
 * that resolves and ships a valid `kubb-extension.json`. Never throws.
 */
export async function discoverExtensions({ root, packages = [] }: { root: string; packages?: Iterable<string> }): Promise<InstalledExtensions> {
  const project = createRequire(path.join(root, 'package.json'))
  const requires = [project]
  try {
    requires.push(createRequire(project.resolve('kubb/package.json')))
  } catch {
    // `kubb` is not installed, so only the project's own dependencies count.
  }

  const dependencies = await readJSON(path.join(root, 'package.json')).then(dependencyNames, () => [])
  const names = [...new Set([...dependencies, ...packages, ...BUILT_IN_PACKAGES])].filter(isPackageName)
  const entries = await Promise.all(names.map((name) => readExtension(requires, name)))

  return new Map(entries.filter((entry) => entry !== undefined).map((entry) => [entry.package, entry]))
}
