import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import type { PackageManagerInfo, PackageManagerName } from '@kubb/core'

export function hasPackageJson(cwd: string = process.cwd()): boolean {
  return fs.existsSync(path.join(cwd, 'package.json'))
}

function spawnAsync(cmd: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', cwd })
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve()
      } else if (signal !== null) {
        reject(new Error(`"${cmd} ${args.join(' ')}" was terminated by signal ${signal}`))
      } else {
        reject(new Error(`"${cmd} ${args.join(' ')}" exited with code ${code}`))
      }
    })
    child.on('error', reject)
  })
}

export async function initPackageJson(cwd: string, packageManager: PackageManagerInfo): Promise<void> {
  const commands: Record<PackageManagerName, string[]> = {
    npm: ['init', '-y'],
    pnpm: ['init'],
    yarn: ['init', '-y'],
    bun: ['init', '-y'],
  }

  await spawnAsync(packageManager.name, commands[packageManager.name], cwd)
}

export async function installPackages(packages: string[], packageManager: PackageManagerInfo, cwd: string = process.cwd()): Promise<void> {
  await spawnAsync(packageManager.name, [...packageManager.installCommand, ...packages], cwd)
}
