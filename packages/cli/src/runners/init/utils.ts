import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
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
}

/** Metadata for each supported package manager, keyed by its short name. */
export const packageManagers: Record<PackageManagerName, PackageManagerInfo> = {
  pnpm: {
    name: 'pnpm',
    lockFiles: ['pnpm-lock.yaml'],
    initCommand: ['init'],
    installCommand: ['add', '-D'],
  },
  yarn: {
    name: 'yarn',
    lockFiles: ['yarn.lock'],
    initCommand: ['init', '-y'],
    installCommand: ['add', '-D'],
  },
  bun: {
    name: 'bun',
    lockFiles: ['bun.lock', 'bun.lockb'],
    initCommand: ['init', '-y'],
    installCommand: ['add', '-d'],
  },
  npm: {
    name: 'npm',
    lockFiles: ['package-lock.json'],
    initCommand: ['init', '-y'],
    installCommand: ['install', '--save-dev'],
  },
}

/** Minimal shape of `package.json` fields read during detection. */
type PackageJson = {
  /** The `packageManager` field from `package.json` (e.g. `"pnpm@9.0.0"`). */
  packageManager?: string
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
 * Returns `true` when a `package.json` exists at `cwd`.
 */
export function hasPackageJson(cwd: string = process.cwd()): boolean {
  return fs.existsSync(path.join(cwd, 'package.json'))
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

/**
 * Installs the given packages at `cwd` using the detected package manager.
 */
export async function installPackages(packages: Array<string>, packageManager: PackageManagerInfo, cwd: string = process.cwd()): Promise<void> {
  await x(packageManager.name, [...packageManager.installCommand, ...packages], {
    nodeOptions: { cwd, stdio: 'inherit' },
    throwOnError: true,
  })
}
