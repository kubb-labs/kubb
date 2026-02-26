import fs from 'node:fs'
import path from 'node:path'

export type PackageManagerName = 'npm' | 'pnpm' | 'yarn' | 'bun'

export interface PackageManagerInfo {
  name: PackageManagerName
  lockFile: string
  installCommand: string[]
}

const packageManagers: Record<PackageManagerName, PackageManagerInfo> = {
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
  const packageJsonPath = path.join(cwd, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
      if (packageJson.packageManager) {
        const [name] = packageJson.packageManager.split('@')
        if (name in packageManagers) {
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
