import type { CommandRunner } from 'gunshi'
import type { definition } from '../../commands/studio/background.ts'
import { startWorker } from './background.ts'
import { createStudioOptions, run } from './run.ts'

export const runner: CommandRunner<{ args: typeof definition.args; extensions: {} }> = async ({ values }) => {
  const options = createStudioOptions(values)
  await run(options, () => startWorker(options))
}
