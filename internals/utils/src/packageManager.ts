import fs from 'node:fs'
import path from 'node:path'

export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun'

export interface PackageManagerInfo {
  /** Identifier used in CLI commands, e.g. `pnpm`, `yarn`. */
  name: PackageManagerName
  /** Lock file name that uniquely identifies this package manager in a project root. */
  lockFile: string
  /** Subcommands passed to the package manager binary to install a dev dependency. */
  installCommand: ReadonlyArray<string>
}

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

/** Minimal shape of `package.json` fields read during detection. */
type PackageJson = {
  /** The `packageManager` field from `package.json` (e.g. `"pnpm@9.0.0"`). */
  packageManager?: string
}

/**
 * Detects the active package manager for the given directory.
 * Resolution order: `packageManager` field in `package.json`, then presence of a lock file.
 * Falls back to npm when no signal is found.
 */
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
    if (fs.existsSync(path.join(cwd, pm.lockFile))) {
      return pm
    }
  }

  return packageManagers.npm
}
