import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { PackageManagerInfo, PackageManagerName } from '@kubb/core'

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

  spawn(packageManager.name, commands[packageManager.name], { stdio: 'inherit', cwd })
}

export async function installPackages(packages: string[], packageManager: PackageManagerInfo, cwd: string = process.cwd()): Promise<void> {
  spawn(packageManager.name, [...packageManager.installCommand, ...packages], { stdio: 'inherit', cwd })
}
