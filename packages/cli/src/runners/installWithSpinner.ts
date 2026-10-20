import process from 'node:process'
import * as clack from '@clack/prompts'
import { formatMs, getElapsedMs } from '@internals/utils'
import { isRichOutput } from '../utils/env.ts'
import { createSpinner } from '../ui/spinner.ts'
import { installPackages, type PackageManagerInfo } from './init/utils.ts'

/** How many package manager lines stay visible under the install title while it runs. */
const LOG_LINES = 6

/**
 * Installs `packages` and reports how long it took. A rich terminal shows the package manager's
 * last lines under the title while the install runs and clears them when it succeeds; a plain one
 * prints the start and end lines. A failed install keeps the output, reports the failure and rethrows.
 */
export async function installWithSpinner({
  packages,
  names,
  packageManager,
  cwd,
  install = installPackages,
}: {
  packages: Array<string>
  names: string
  packageManager: PackageManagerInfo
  cwd: string
  /** Runs the install itself, so a dry run can skip it. */
  install?: typeof installPackages
}): Promise<void> {
  const start = process.hrtime()
  const task = createTask(`Installing ${names} with ${packageManager.name}`)
  try {
    await install(packages, packageManager, cwd, task.message)
  } catch (error) {
    task.error('Install failed')
    throw error
  }
  task.success(`Installed ${names} with ${packageManager.name} in ${formatMs(getElapsedMs(start))}`)
}

type Task = { message: (line: string) => void; error: (text: string) => void; success: (text: string) => void }

// clack's taskLog prints nothing at the end outside a TTY, so a plain terminal keeps the spinner writer.
// The failure keeps no log: the thrown error already carries the last lines.
function createTask(title: string): Task {
  if (isRichOutput()) {
    const log = clack.taskLog({ title, limit: LOG_LINES })
    return { message: (line) => log.message(line), error: (text) => log.error(text, { showLog: false }), success: (text) => log.success(text) }
  }
  const spinner = createSpinner()
  spinner.start(title)
  return { message: () => {}, error: (text) => spinner.error(text), success: (text) => spinner.stop(text) }
}
