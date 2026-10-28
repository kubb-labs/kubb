import path from 'node:path'
import process from 'node:process'
import { findConfigFile } from '@internals/shared'
import { studioCommand } from './studioCommand.ts'

export const command = studioCommand({
  name: 'permissions',
  description: 'Change what Kubb Studio may do in this project.',
  examples: 'kubb studio permissions',
  args: {},
  async action(options) {
    const { readCredentials } = await import('../../runners/studio/credentials.ts')
    const { resolvePermissions } = await import('../../runners/studio/run.ts')
    const { canUseTTY } = await import('../../utils/env.ts')

    const credentials = await readCredentials()
    if (!credentials) throw new Error('This project is not paired with Kubb Studio. Run `kubb studio` first.')
    if (!canUseTTY()) throw new Error('Changing permissions needs an interactive terminal.')

    const configFile = findConfigFile()
    await resolvePermissions(options, credentials, configFile && path.relative(process.cwd(), configFile), { edit: true })
    console.log(
      'Permissions saved. A running connection keeps the old ones until you restart it with the same flags: press Ctrl+C and run `kubb studio` again, or run `kubb studio stop`, then `kubb studio start`.',
    )
  },
})
