export { generateAgentKey, getAgentPublicKey, getTokenRefreshPayload, signAgentPayload, verifyAgentSignature } from './agentKey.ts'
export { connectAgent, IncompatibleAgentError, InvalidAgentTokenError, type ConnectAgentOptions, type StudioConnectedContext } from './connect.ts'
export {
  pairAgent,
  PAIRING_CODE_PREFIX,
  PairingCanceledError,
  PairingCodeError,
  PairingDeniedError,
  PairingExpiredError,
  redeemPairingCode,
  refreshAgentToken,
  renewAgentToken,
  type PairingCodeErrorCode,
  type PairingResult,
  type RedeemedPairing,
  type RedeemPairingCodeOptions,
  type RenewedAgentToken,
} from './pair.ts'
export { createSnapshot } from './snapshot.ts'
export { defaultStudioUrl } from './url.ts'
export { editConfig, editConfigFile } from '@internals/shared'
