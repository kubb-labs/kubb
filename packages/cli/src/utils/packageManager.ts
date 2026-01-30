import fs from 'node:fs'
import path from 'node:path'
import { execa } from 'execa'

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

export interface PackageManagerInfo {
  name: PackageManager
  lockFile: string
  installCommand: string[]
}

const packageManagers: Record<PackageManager, PackageManagerInfo> = {
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

export function detectPackageManager(cwd: string = process.cwd()): PackageManagerInfo {
  // Check for packageManager field in package.json
  const packageJsonPath = path.join(cwd, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      if (packageJson.packageManager) {
        const [name] = packageJson.packageManager.split('@')
        if (name in packageManagers) {
          return packageManagers[name as PackageManager]
        }
      }
    } catch {
      // Continue to lock file detection
    }
  }

  // Check for lock files
  for (const pm of Object.values(packageManagers)) {
    if (fs.existsSync(path.join(cwd, pm.lockFile))) {
      return pm
    }
  }

  // Default to npm
  return packageManagers.npm
}

export function hasPackageJson(cwd: string = process.cwd()): boolean {
  return fs.existsSync(path.join(cwd, 'package.json'))
}

export async function initPackageJson(cwd: string, packageManager: PackageManagerInfo): Promise<void> {
  const commands: Record<PackageManager, string[]> = {
    npm: ['init', '-y'],
    pnpm: ['init'],
    yarn: ['init', '-y'],
    bun: ['init', '-y'],
  }

  await execa(packageManager.name, commands[packageManager.name], {
    cwd,
    stdio: 'inherit',
  })
}

export async function installPackages(packages: string[], packageManager: PackageManagerInfo, cwd: string = process.cwd()): Promise<void> {
  await execa(packageManager.name, [...packageManager.installCommand, ...packages], {
    cwd,
    stdio: 'inherit',
  })
}
