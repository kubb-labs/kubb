export { createClient, type Client, type ClientOptions } from './client.ts'
export { AgentCloseCode, generationEventTypes } from './protocol/index.ts'
export type {
  AgentApi,
  AgentLoad,
  ConfigEdit,
  ConnectMessagePayload,
  GenerateInput,
  GenerateResult,
  GenerationEvent,
  GenerationEventPayloads,
  GenerationEventType,
  GenerationRun,
  PublishSnapshotInput,
  PublishSnapshotResult,
  RpcClose,
  RpcConnection,
  RpcConnector,
  StudioApi,
} from './protocol/index.ts'
export type { StudioConnectedContext } from './hooks.ts'
export {
  createAgent,
  createJob,
  waitForJob,
  InvalidAgentTokenError,
  type StudioAgent,
  type StudioJob,
  type StudioJobStatus,
  type StudioSnapshot,
  type StudioSnapshotChanges,
} from './api.ts'
export { defaultStudioUrl } from './constants.ts'
export type { AgentCapacity } from './constants.ts'
export { createFileStorage, machineTokenFrom, setStorage } from './machine.ts'
export { runConnection, type ConnectionOptions } from './runConnection.ts'
export {
  pairAgent,
  PairingCanceledError,
  PairingDeniedError,
  PairingExpiredError,
  pollForPairingToken,
  startPairing,
  type PairingAgentType,
  type PairingResult,
  type PairingSession,
} from './pair.ts'
export { connectWebSocketRpc } from './rpc.ts'
