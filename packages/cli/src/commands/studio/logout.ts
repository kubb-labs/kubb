import { define } from 'gunshi'
import { configArg, logLevelArg, studioConnectionArgs, studioPermissionArgs } from '../shared.ts'

export const command = define({
  name: 'logout',
  description: 'Forget the stored Kubb Studio token.',
  examples: ['kubb studio logout'].join('\n'),
  toKebab: true,
  args: {
    ...configArg,
    ...studioConnectionArgs,
    ...studioPermissionArgs,
    ...logLevelArg,
  },
  async run(ctx) {
    const { logoutRunner } = await import('../../runners/studio/commands.ts')
    await logoutRunner(ctx)
  },
})
