import { define } from 'gunshi'
import { command as connectCommand } from './connect.ts'
import { command as loginCommand } from './login.ts'
import { command as logoutCommand } from './logout.ts'
import { command as snapshotCommand } from './snapshot.ts'
import { command as startCommand, stopCommand } from './background.ts'
import { command as statusCommand } from './status.ts'

export const command = define({
  name: 'studio',
  description: 'Connect this project to Kubb Studio, or manage its pairing and snapshots.',
  examples: ['kubb studio', 'kubb studio --allow-read', 'kubb studio login', 'kubb studio status', 'kubb studio logout', 'kubb studio snapshot'].join('\n'),
  toKebab: true,
  args: connectCommand.args,
  async run(ctx) {
    const { connectRunner } = await import('../../runners/studio/commands.ts')
    await connectRunner(ctx)
  },
  subCommands: {
    start: startCommand,
    stop: stopCommand,
    connect: connectCommand,
    login: loginCommand,
    logout: logoutCommand,
    status: statusCommand,
    snapshot: snapshotCommand,
  },
})

/**
 * Sends `kubb studio --flag value` to `kubb studio connect`, the same runner. gunshi picks a
 * subcommand from the first token that is not a flag, so `--url http://…` would read the URL as one.
 */
export function routeStudioFlags(args: Array<string>): Array<string> {
  const [name, next] = args
  if (name !== 'studio' || !next?.startsWith('-') || args.includes('--help') || args.includes('-h')) return args

  return ['studio', 'connect', ...args.slice(1)]
}
