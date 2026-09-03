export { createClient, type Client, type ClientOptions } from './client.ts'
export type {
  AgentHooks,
  StudioCommandEndContext,
  StudioCommandStartContext,
  StudioConnectedContext,
  StudioConnectingContext,
  StudioDisconnectedContext,
  StudioErrorContext,
  StudioWarnContext,
} from './hooks.ts'
export { InvalidAgentTokenError } from './api.ts'
export { defaultStudioUrl } from './constants.ts'
export { createFileStorage, setStorage } from './machine.ts'
export { pollForPairingToken, startPairing } from './pair.ts'
