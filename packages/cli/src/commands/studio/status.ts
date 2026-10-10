import { define } from 'gunshi'
import { configArg, logLevelArg, studioConnectionArgs, studioPermissionArgs } from '../shared.ts'

export const command = define({
  name: 'status',
  description: 'Show the project worker, Kubb Studio pairing, and saved permissions.',
  examples: ['kubb studio status'].join('\n'),
  toKebab: true,
  args: {
    ...configArg,
    ...studioConnectionArgs,
    ...studioPermissionArgs,
    ...logLevelArg,
  },
  async run(ctx) {
    const { statusRunner } = await import('../../runners/studio/commands.ts')
    await statusRunner(ctx)
  },
})
