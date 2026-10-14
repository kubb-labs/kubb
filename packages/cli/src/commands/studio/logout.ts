import { studioCommand } from './studioCommand.ts'

export const command = studioCommand({
  name: 'logout',
  description: 'Forget the stored Kubb Studio token.',
  examples: 'kubb studio logout',
  args: {},
  async action() {
    const { stopWorker } = await import('../../runners/studio/background.ts')
    const { clearCredentials } = await import('../../runners/studio/credentials.ts')
    await stopWorker()
    await clearCredentials()
    console.log('Signed out of Kubb Studio.')
  },
})
