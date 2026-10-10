import process from 'node:process'
import { styleText } from 'node:util'
import type { CommandRunner } from 'gunshi'
import type { command as connectCommand } from '../../commands/studio/connect.ts'
import type { command as logoutCommand } from '../../commands/studio/logout.ts'
import type { command as statusCommand } from '../../commands/studio/status.ts'
import { getWorkerLogPath, getWorkerStatus, startWorker, stopWorker } from './background.ts'
import { clearCredentials, readCredentials } from './credentials.ts'
import { connect, createStudioOptions, formatPermissionRows, login, run, type StudioOptions } from './run.ts'

type Runner<T extends { args: object }> = CommandRunner<{ args: T['args']; extensions: {} }>

/**
 * Reports the paired agent and any saved permissions for the current project.
 */
async function status(options: StudioOptions): Promise<void> {
  const credentials = await readCredentials()

  if (!credentials) {
    console.log('Not paired. Run `kubb studio login`.')

    return
  }

  console.log(`Paired with ${credentials.studioUrl} as ${styleText('cyan', credentials.agentSlug || credentials.agentId)}`)

  if (credentials.studioUrl !== options.studioUrl) {
    console.log(styleText('yellow', `Connecting to ${options.studioUrl} needs pairing again.`))
  }

  const remembered = credentials.projects?.[process.cwd()]

  if (!remembered) {
    console.log(styleText('dim', 'No saved permissions for this project. Run `kubb studio` to connect and choose.'))

    return
  }

  console.log(styleText('dim', 'Saved permissions'))

  for (const row of formatPermissionRows({
    allowRead: remembered.allowRead === true,
    allowWrite: remembered.allowWrite === true,
    allowConfigEdit: remembered.allowConfigEdit === true,
    allowExec: remembered.allowExec === true,
  })) {
    console.log(row)
  }
}

export const connectRunner: Runner<typeof connectCommand> = async ({ values }) => {
  const options = createStudioOptions(values)
  await run(options, () => connect(options), { block: true })
}

export const loginRunner: Runner<typeof connectCommand> = async ({ values }) => {
  const options = createStudioOptions(values)
  await run(options, () => login(options))
}

export const logoutRunner: Runner<typeof logoutCommand> = async ({ values }) => {
  const options = createStudioOptions(values)
  await run(options, async () => {
    await stopWorker()
    await clearCredentials()
    console.log('Signed out of Kubb Studio.')
  })
}

export const startRunner: Runner<typeof connectCommand> = async ({ values }) => {
  const options = createStudioOptions(values)
  await run(options, () => startWorker(options))
}

export const statusRunner: Runner<typeof statusCommand> = async ({ values }) => {
  const options = createStudioOptions(values)
  await run(options, async () => {
    const worker = await getWorkerStatus()
    console.log(`Background connection: ${worker.state}${worker.running ? ` (PID ${worker.pid})` : ''}`)
    console.log(`Logs: ${getWorkerLogPath()}`)
    await status(options)
  })
}

export async function stopRunner(): Promise<void> {
  await stopWorker()
  console.log('Background connection stopped.')
}
