import fs from 'node:fs'
import path from 'node:path'
import { spawnAsync } from '@internals/utils'
import type { PackageManagerInfo, PackageManagerName } from '@internals/utils'

export function hasPackageJson(cwd: string = process.cwd()): boolean {
  return fs.existsSync(path.join(cwd, 'package.json'))
}

export async function initPackageJson(cwd: string, packageManager: PackageManagerInfo): Promise<void> {
  const commands: Record<PackageManagerName, string[]> = {
    npm: ['init', '-y'],
    pnpm: ['init'],
    yarn: ['init', '-y'],
    bun: ['init', '-y'],
  }

  await spawnAsync(packageManager.name, commands[packageManager.name], { cwd })
}

export async function installPackages(packages: string[], packageManager: PackageManagerInfo, cwd: string = process.cwd()): Promise<void> {
  await spawnAsync(packageManager.name, [...packageManager.installCommand, ...packages], { cwd })
}
