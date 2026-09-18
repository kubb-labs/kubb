import type { CommandRunner } from 'gunshi'
import type { definition } from '../../commands/studio/status.ts'
import { createStudioOptions, run, status } from './run.ts'

export const runner: CommandRunner<{ args: typeof definition.args; extensions: {} }> = async ({ values }) => {
  const options = createStudioOptions(values)
  await run(options, () => status(options))
}
