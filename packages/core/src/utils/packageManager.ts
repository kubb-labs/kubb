import fs from 'node:fs'
import path from 'node:path'
import type { PackageManagerInfo, PackageManagerName } from '../constants.ts'
import { packageManagers } from '../constants.ts'

export type { PackageManagerInfo, PackageManagerName }

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
