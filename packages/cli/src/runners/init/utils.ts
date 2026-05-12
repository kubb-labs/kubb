import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import type { PackageManagerInfo, PackageManagerName } from '@internals/utils'
import { spawnAsync } from '@internals/utils'

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
  const commands: Record<PackageManagerName, string[]> = {
    npm: ['init', '-y'],
    pnpm: ['init'],
    yarn: ['init', '-y'],
    bun: ['init', '-y'],
  }

  await spawnAsync(packageManager.name, commands[packageManager.name], { cwd })
}

/**
 * Installs the given packages at `cwd` using the detected package manager.
 */
export async function installPackages(packages: string[], packageManager: PackageManagerInfo, cwd: string = process.cwd()): Promise<void> {
  await spawnAsync(packageManager.name, [...packageManager.installCommand, ...packages], { cwd })
}
