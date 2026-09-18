import type { CommandRunner } from 'gunshi'
import type { definition } from '../../commands/studio/logout.ts'
import { clearCredentials } from './credentials.ts'
import { createStudioOptions, run } from './run.ts'

export const runner: CommandRunner<{ args: typeof definition.args; extensions: {} }> = async ({ values }) => {
  const options = createStudioOptions(values)
  await run(options, async () => {
    await clearCredentials()
    console.log('Signed out of Kubb Studio.')
  })
}
