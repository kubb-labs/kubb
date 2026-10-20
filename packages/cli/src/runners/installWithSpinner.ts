import process from 'node:process'
import { formatMs, getElapsedMs } from '@internals/utils'
import { createSpinner } from '../loggers/output.ts'
import { installPackages, type PackageManagerInfo } from './init/utils.ts'

/**
 * Installs `packages` behind a spinner and reports how long it took. A failed install stops the
 * spinner with an error and rethrows.
 */
export async function installWithSpinner({
  packages,
  names,
  packageManager,
  cwd,
}: {
  packages: Array<string>
  names: string
  packageManager: PackageManagerInfo
  cwd: string
}): Promise<void> {
  const spinner = createSpinner()
  const start = process.hrtime()
  spinner.start(`Installing ${names} with ${packageManager.name}`)
  try {
    await installPackages(packages, packageManager, cwd)
  } catch (error) {
    spinner.error('Install failed')
    throw error
  }
  spinner.stop(`Installed ${names} with ${packageManager.name} in ${formatMs(getElapsedMs(start))}`)
}
