import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { type ExtensionManifest, isExtensionManifest, isPackageName } from './manifest.ts'

export type InstalledPackage = { package: string; version?: string; manifest?: ExtensionManifest }

/** Reads and parses a JSON file. Throws when it is missing or not JSON. */
const readJSON = async (file: string): Promise<unknown> => JSON.parse(await readFile(file, 'utf8'))

/**
 * The `dependencies` and `devDependencies` of the project at `root`, plus `packages`, with the
 * installed version and the valid `kubb-extension.json` each one ships, when it does. A package
 * also counts as installed when it resolves from one of the `resolveFrom` packages, such as `kubb`
 * for the extensions it ships with.
 */
export async function readInstalledPackages({
  root,
  packages = [],
  resolveFrom = [],
}: {
  root: string
  packages?: Iterable<string>
  resolveFrom?: Array<string>
}): Promise<Array<InstalledPackage>> {
  const project = createRequire(path.join(root, 'package.json'))
  const requires = [
    project,
    ...resolveFrom.flatMap((name) => {
      try {
        return [createRequire(project.resolve(`${name}/package.json`))]
      } catch {
        return []
      }
    }),
  ]
  const packageJSON = (await readJSON(path.join(root, 'package.json')).catch(() => null)) as { dependencies?: unknown; devDependencies?: unknown } | null
  const dependencies = [packageJSON?.dependencies, packageJSON?.devDependencies].flatMap((record) =>
    typeof record === 'object' && record !== null ? Object.keys(record) : [],
  )

  return Promise.all(
    [...new Set([...dependencies, ...packages])].filter(isPackageName).map(async (name): Promise<InstalledPackage> => {
      // Found on disk rather than resolved, because an `exports` map may hide `package.json` and the manifest.
      const dir = requires
        .flatMap((require) => require.resolve.paths(name) ?? [])
        .map((dir) => path.join(dir, name))
        .find((dir) => existsSync(path.join(dir, 'package.json')))
      if (!dir) return { package: name }
      try {
        const { version } = (await readJSON(path.join(dir, 'package.json'))) as { version?: unknown }
        const manifest = await readJSON(path.join(dir, 'kubb-extension.json')).catch(() => undefined)
        return { package: name, version: typeof version === 'string' ? version : undefined, manifest: isExtensionManifest(manifest) ? manifest : undefined }
      } catch {
        return { package: name }
      }
    }),
  )
}
