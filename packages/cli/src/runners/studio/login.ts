import type { CommandRunner } from 'gunshi'
import type { definition } from '../../commands/studio/login.ts'
import { createStudioOptions, login, run } from './run.ts'

export const runner: CommandRunner<{ args: typeof definition.args; extensions: {} }> = async ({ values }) => {
  const options = createStudioOptions(values)
  await run(options, () => login(options))
}
