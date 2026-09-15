export { createClient, type Client, type ClientOptions } from './client.ts'
export type { StudioConnectedContext } from './hooks.ts'
export {
  createStudioAgent,
  StudioAgent,
  type StudioAgentCredentials,
  type StudioAgentJob,
  type StudioAgentJobStatus,
  type StudioAgentJobOptions,
  type StudioAgentOptions,
  type StudioSnapshot,
} from './studioAgent.ts'
export { InvalidAgentTokenError } from './api.ts'
export { defaultStudioUrl } from './constants.ts'
export { createFileStorage, setStorage } from './machine.ts'
export { runConnection, type ConnectionOptions } from './runConnection.ts'
export { PairingCanceledError, pollForPairingToken, startPairing } from './pair.ts'
