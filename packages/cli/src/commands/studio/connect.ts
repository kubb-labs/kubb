import { configArg, logLevelArg, studioConnectionArgs, studioPermissionArgs } from '../shared.ts'
import { studioCommand } from './studioCommand.ts'

export const command = studioCommand({
  name: 'connect',
  description: 'Connect this project to Kubb Studio and generate from the browser.',
  examples: [
    'kubb studio connect',
    'kubb studio connect --allow-read',
    'kubb studio connect --allow-write --allow-exec',
    'kubb studio connect --url http://localhost:3000',
  ].join('\n'),
  args: {
    ...configArg,
    ...studioConnectionArgs,
    ...studioPermissionArgs,
    open: {
      type: 'boolean',
      description: 'Open the approval page in a browser while pairing',
      default: true,
      negatable: true,
    },
    ...logLevelArg,
  },
  block: true,
  async action(options) {
    const { connect } = await import('../../runners/studio/run.ts')
    await connect(options)
  },
})
