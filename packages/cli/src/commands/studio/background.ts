import { define } from 'gunshi'
import { command as connectCommand } from './connect.ts'
import { studioCommand } from './studioCommand.ts'

export const command = studioCommand({
  name: 'start',
  description: 'Keep this project connected to Kubb Studio in the background.',
  args: connectCommand.args,
  async action(options) {
    const { startWorker } = await import('../../runners/studio/background.ts')
    await startWorker(options)
  },
})

export const stopCommand = define({
  name: 'stop',
  description: "Stop this project's background connection and keep its pairing.",
  async run() {
    const { stopWorker } = await import('../../runners/studio/background.ts')
    await stopWorker()
    console.log('Background connection stopped.')
  },
})
