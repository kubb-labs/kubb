import { define } from 'gunshi'
import { configArg, logLevelArg, openArg, studioConnectionArgs, studioPermissionArgs } from '../shared.ts'

export const command = define({
  name: 'connect',
  description: 'Connect this project to Kubb Studio and generate from the browser.',
  examples: [
    'kubb studio connect',
    'kubb studio connect --allow-read',
    'kubb studio connect --allow-write --allow-exec',
    'kubb studio connect --url http://localhost:3000',
  ].join('\n'),
  toKebab: true,
  args: {
    ...configArg,
    ...studioConnectionArgs,
    ...studioPermissionArgs,
    ...openArg,
    ...logLevelArg,
  },
  async run(ctx) {
    const { connectRunner } = await import('../../runners/studio/commands.ts')
    await connectRunner(ctx)
  },
})
