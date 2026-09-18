import { define } from 'gunshi'
import { configArg, logLevelArg, studioConnectionArgs, studioPermissionArgs } from '../shared.ts'

export const definition = define({
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
    open: {
      type: 'boolean',
      description: 'Open the approval page in a browser while pairing',
      default: true,
      negatable: true,
    },
    ...logLevelArg,
  },
})
