export { createClient, type Client, type ClientOptions } from './runtime/client.ts'
export { AGENT_INSTANCE_HEADER, AgentCloseCode, generationEventTypes } from './protocol/index.ts'
export type {
  AgentApi,
  AgentCapacity,
  AgentRegisterInput,
  AgentRegisterResponse,
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
export type { StudioConnectedContext } from './operations/hooks.ts'
export {
  createAgent,
  createJob,
  waitForJob,
  IncompatibleAgentError,
  InvalidAgentTokenError,
  type StudioAgent,
  type StudioBranchSnapshotChanges,
  type StudioJob,
  type StudioJobStatus,
  type StudioSnapshot,
  type StudioSnapshotChanges,
} from './operations/api.ts'
export { defaultStudioUrl } from './operations/constants.ts'
export { createFileStorage, machineTokenFrom, setStorage } from './operations/machine.ts'
export { runConnection, type ConnectionOptions } from './runtime/runConnection.ts'
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
} from './operations/pair.ts'
export { connectWebSocketRpc } from './operations/rpc.ts'
