import process from 'node:process'
import { styleText } from 'node:util'
import { studioConnectionArgs } from '../shared.ts'
import { studioCommand } from './studioCommand.ts'

export const command = studioCommand({
  name: 'status',
  description: 'Show the project worker, Kubb Studio pairing, and saved permissions.',
  examples: 'kubb studio status',
  args: { url: studioConnectionArgs.url },
  async action(options) {
    const { getWorkerLogPath, getWorkerStatus } = await import('../../runners/studio/background.ts')
    const { readCredentials } = await import('../../runners/studio/credentials.ts')
    const { formatPermissionRows } = await import('../../runners/studio/run.ts')

    const worker = await getWorkerStatus()
    console.log(`Background connection: ${worker.state}${worker.running ? ` (PID ${worker.pid})` : ''}`)
    console.log(`Logs: ${getWorkerLogPath()}`)

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
  },
})
