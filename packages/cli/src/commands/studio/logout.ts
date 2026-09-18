import { define } from 'gunshi'
import { configArg, logLevelArg, studioConnectionArgs, studioPermissionArgs } from '../shared.ts'

export const definition = define({
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
})
