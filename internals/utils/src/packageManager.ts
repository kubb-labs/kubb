import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Supported package manager identifiers.
 *
 * @example
 * ```ts
 * const pm: PackageManagerName = 'pnpm'
 * ```
 */
export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun'

/**
 * Metadata describing a package manager's lock file and install command.
 */
export interface PackageManagerInfo {
  /**
   * Identifier used in CLI commands, e.g. `pnpm`, `yarn`.
   */
  name: PackageManagerName
  /**
   * Lock file name that uniquely identifies this package manager in a project root.
   */
  lockFile: string
  /**
   * Subcommands passed to the package manager binary to install a dev dependency.
   */
  installCommand: ReadonlyArray<string>
}

/**
 * Metadata for each supported package manager, keyed by its short name.
 *
 * @example
 * ```ts
 * packageManagers.pnpm.installCommand // ['add', '-D']
 * packageManagers.npm.lockFile        // 'package-lock.json'
 * ```
 */
export const packageManagers: Record<PackageManagerName, PackageManagerInfo> = {
  pnpm: {
    name: 'pnpm',
    lockFile: 'pnpm-lock.yaml',
    installCommand: ['add', '-D'],
  },
  yarn: {
    name: 'yarn',
    lockFile: 'yarn.lock',
    installCommand: ['add', '-D'],
  },
  bun: {
    name: 'bun',
    lockFile: 'bun.lockb',
    installCommand: ['add', '-d'],
  },
  npm: {
    name: 'npm',
    lockFile: 'package-lock.json',
    installCommand: ['install', '--save-dev'],
  },
}

/**
 * Minimal shape of `package.json` fields read during detection.
 */
type PackageJson = {
  /**
   * The `packageManager` field from `package.json` (e.g. `"pnpm@9.0.0"`).
   */
  packageManager?: string
}

/**
 * Detects the active package manager for the given directory.
 * Resolution order: `packageManager` field in `package.json`, then presence of a lock file.
 * Falls back to `npm` when no signal is found.
 *
 * @example
 * ```ts
 * detectPackageManager('/my/project') // { name: 'pnpm', lockFile: 'pnpm-lock.yaml', ... }
 * detectPackageManager()              // falls back to npm when no lock file is found
 * ```
 */
export function detectPackageManager(cwd: string = process.cwd()): PackageManagerInfo {
  const packageJsonPath = join(cwd, 'package.json')
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson
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
    if (existsSync(join(cwd, pm.lockFile))) {
      return pm
    }
  }

  return packageManagers.npm
}
