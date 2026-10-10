import { define } from 'gunshi'
import { command as connectCommand } from './connect.ts'

export const command = define({
  name: 'login',
  description: 'Pair this machine with Kubb Studio without connecting.',
  examples: ['kubb studio login', 'kubb studio login --url http://localhost:3000'].join('\n'),
  toKebab: true,
  args: connectCommand.args,
  async run(ctx) {
    const { loginRunner } = await import('../../runners/studio/commands.ts')
    await loginRunner(ctx)
  },
})
