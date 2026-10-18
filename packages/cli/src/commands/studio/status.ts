import process from 'node:process'
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
    const { formatStatus } = await import('../../runners/studio/status.ts')

    const [worker, credentials] = await Promise.all([getWorkerStatus(), readCredentials()])
    console.log(
      ['', ...formatStatus({ studioUrl: options.studioUrl, credentials, worker, project: process.cwd(), logPath: getWorkerLogPath() }), ''].join('\n'),
    )
  },
})
