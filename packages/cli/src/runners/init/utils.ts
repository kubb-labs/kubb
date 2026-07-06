import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { x } from 'tinyexec'
import type { PackageManagerInfo, PackageManagerName } from '../../tools.ts'

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
  const commands: Record<PackageManagerName, Array<string>> = {
    npm: ['init', '-y'],
    pnpm: ['init'],
    yarn: ['init', '-y'],
    bun: ['init', '-y'],
  }

  await x(packageManager.name, commands[packageManager.name], {
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
