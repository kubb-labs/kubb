import { command as connectCommand } from './connect.ts'
import { studioCommand } from './studioCommand.ts'

export const command = studioCommand({
  name: 'login',
  description: 'Pair this machine with Kubb Studio without connecting.',
  examples: ['kubb studio login', 'kubb studio login --url http://localhost:3000'].join('\n'),
  args: connectCommand.args,
  async action(options) {
    const { login, redeemPairing, takePairingCode } = await import('../../runners/studio/run.ts')
    // An MCP client hands over a one-time code in KUBB_STUDIO_PAIRING_CODE, which pairs without a browser.
    const pairingCode = takePairingCode()
    await (pairingCode ? redeemPairing(options, { pairingCode }) : login(options))
  },
})
