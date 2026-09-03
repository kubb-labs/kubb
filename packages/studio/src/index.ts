export { createClient, type Client, type ClientOptions } from './client.ts'
export type {
  AgentHooks,
  StudioCommandEndContext,
  StudioCommandStartContext,
  StudioConnectedContext,
  StudioDisconnectedContext,
  StudioErrorContext,
  StudioHooks,
  StudioWarnContext,
} from './hooks.ts'
export { InvalidAgentTokenError } from './api.ts'
export { defaultStudioUrl } from './constants.ts'
export { createFileStorage, setStorage } from './machine.ts'
export { pollForPairingToken, startPairing } from './pair.ts'
