import { define } from 'gunshi'
import { command as connectCommand } from './connect.ts'

export const command = define({
  name: 'start',
  description: 'Keep this project connected to Kubb Studio in the background.',
  toKebab: true,
  args: connectCommand.args,
  async run(ctx) {
    const { startRunner } = await import('../../runners/studio/commands.ts')
    await startRunner(ctx)
  },
})

export const stopCommand = define({
  name: 'stop',
  description: "Stop this project's background connection and keep its pairing.",
  async run() {
    const { stopRunner } = await import('../../runners/studio/commands.ts')
    await stopRunner()
  },
})
