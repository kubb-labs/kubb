import { readInstalledPackages } from '@kubb/core'
import type { ExtensionEntry } from './protocol.ts'

/**
 * The extension packages installed in a project, keyed by package name. Only these, besides
 * `@kubb/plugin-*` packages, may be imported on behalf of Studio.
 */
export type InstalledExtensions = ReadonlyMap<string, ExtensionEntry>

/** Extensions `kubb` ships with, so they count as installed without being a direct dependency. */
const BUILT_IN_PACKAGES = ['@kubb/adapter-oas', '@kubb/parser-ts', '@kubb/parser-md', '@kubb/plugin-barrel']

/**
 * Finds the extensions installed in the project at `root`: its `dependencies` and `devDependencies`,
 * the `packages` its config file imports, and the extensions `kubb` ships with. Keeps each package
 * that resolves and ships a valid `kubb-extension.json`. Never throws.
 */
export async function discoverExtensions({ root, packages = [] }: { root: string; packages?: Iterable<string> }): Promise<InstalledExtensions> {
  const installed = await readInstalledPackages({ root, packages: [...packages, ...BUILT_IN_PACKAGES], resolveFrom: ['kubb'] })

  return new Map(
    installed.flatMap(({ package: name, version, manifest }) =>
      version !== undefined && manifest ? [[name, { package: name, version, manifest }] as const] : [],
    ),
  )
}
