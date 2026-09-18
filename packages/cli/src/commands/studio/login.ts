import { define } from 'gunshi'
import { configArg, logLevelArg, studioConnectionArgs, studioPermissionArgs } from '../shared.ts'

export const definition = define({
  name: 'login',
  description: 'Pair this machine with Kubb Studio without connecting.',
  examples: ['kubb studio login', 'kubb studio login --url http://localhost:3000'].join('\n'),
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
