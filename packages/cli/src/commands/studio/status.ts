import { define } from 'gunshi'
import { configArg, logLevelArg, studioConnectionArgs, studioPermissionArgs } from '../shared.ts'

export const definition = define({
  name: 'status',
  description: 'Show the machine’s Kubb Studio pairing and saved project permissions.',
  examples: ['kubb studio status'].join('\n'),
  toKebab: true,
  args: {
    ...configArg,
    ...studioConnectionArgs,
    ...studioPermissionArgs,
    ...logLevelArg,
  },
})
