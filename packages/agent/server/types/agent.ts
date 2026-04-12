/**
 * WebSocket message types for agent communication protocol
 *
 * Messages flow bidirectionally between Studio backend and CLI agents:
 * - Studio → Agent: CommandMessage (generate, connect), UpdateConfigMessage
 * - Agent → Studio: ConnectedMessage, DataMessage, PingMessage
 * - Studio → Agent: PongMessage
 * - Bidirectional: ErrorMessage, StatusMessage
 */

import type { FileNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'

export type JSONKubbConfig = {
  plugins?: Array<{
    name: string
    options: object
  }>
  /**
   * Raw OpenAPI / Swagger spec content (YAML or JSON string).
   * Only possible to set when agent type is 'sandbox'
   */
  input?: string
}

/**
 * Typed events sent by the Kubb agent.
 * Follows the same tuple structure as {@link KubbEvents}.
 */
export type KubbEvents = {
  'kubb:plugin:start': [plugin: { name: string }]
  'kubb:plugin:end': [plugin: { name: string }, meta: { duration: number; success: boolean }]
  'kubb:files:processing:start': [meta: { total: number }]
  'kubb:file:processing:update': [
    meta: {
      file: string
      processed: number
      total: number
      percentage: number
    },
  ]
  'kubb:files:processing:end': [meta: { total: number }]
  'kubb:info': [message: string, info?: string]
  'kubb:success': [message: string, info?: string]
  'kubb:warn': [message: string, info?: string]
  'kubb:error': [error: { message: string; stack?: string }]
  'kubb:generation:start': [config: { name?: string; plugins: number }]
  'kubb:generation:end': [Config: Config, files: Array<FileNode>, sources: Record<string, string>]
  'kubb:lifecycle:end': []
}

export type KubbEvent = keyof KubbEvents

/**
 * Payload for the publish command, sent from Studio to the Agent.
 * The agent uses the command field to run the publish shell command.
 * If command is omitted, the agent falls back to the KUBB_AGENT_PUBLISH_COMMAND
 * env var and then to 'npm publish'.
 */
export type PublishCommandPayload = {
  publisher: 'npm'
  /** Optional shell command override, e.g. 'npm publish --access public' */
  command?: string
  /** Arbitrary metadata stored in Studio (name, version, scope, …) */
  meta?: Record<string, unknown>
}

/**
 * Command message sent from Studio to Agent
 * Triggers actions like code generation or connection establishment
 */
export type CommandMessage =
  | { type: 'command'; command: 'generate'; payload: JSONKubbConfig }
  | {
      type: 'command'
      command: 'connect'
      permissions: {
        allowAll: boolean
        allowWrite: boolean
        allowPublish: boolean
      }
    }
  | { type: 'command'; command: 'publish'; payload: PublishCommandPayload }

export type ConnectMessagePayload = {
  version: string
  configPath: string
  config: JSONKubbConfig
  permissions: {
    allowAll: boolean
    allowWrite: boolean
    allowPublish: boolean
  }
}

/**
 * Connected message sent from Agent to Studio
 * Includes agent info like supported plugins and version
 */
export type ConnectedMessage = {
  type: 'connected'
  payload: ConnectMessagePayload
}

/**
 * Error message for communicating failures
 */
export type ErrorMessage = {
  type: 'kubb:error'
  message: string
}

/**
 * Ping message from Agent to keep connection alive
 */
export type PingMessage = {
  type: 'ping'
}

/**
 * Pong response from Studio to Agent ping
 */
export type PongMessage = {
  type: 'pong'
}

/**
 * Disconnect message sent from Studio to Agent when the session is expired or revoked.
 * The agent should close the connection without reconnecting.
 */
export type DisconnectMessage = {
  type: 'disconnect'
  reason: 'expired' | 'revoked'
}

/**
 * Status message with connected agents information
 */
export type StatusMessage = {
  type: 'status'
  message: string
  connectedAgents: number
  agents: Array<{
    name: string
    connectedAt: string
  }>
}

export type DataMessagePayload<T extends KubbEvent = KubbEvent> = {
  type: T
  data: KubbEvents[T]
  timestamp: number
  source?: 'generate' | 'publish'
}

/**
 * Data message containing code generation events
 * Wraps Kubb SSE events for real-time generation progress
 */
export type DataMessage<T extends KubbEvent = KubbEvent> = {
  type: 'data'
  payload: DataMessagePayload<T>
}

/** Response returned by the Studio `/api/agent/session/create` endpoint. */
export type AgentConnectResponse = {
  wsUrl: string
  expiresAt: string
  revokedAt: string | null
  sessionId: string
  isSandbox: boolean
}

export type AgentMessage = CommandMessage | DataMessage | ConnectedMessage | ErrorMessage | StatusMessage | PingMessage | PongMessage | DisconnectMessage

// Helper type guards
export function isCommandMessage(msg: AgentMessage): msg is CommandMessage {
  return msg.type === 'command'
}

/**
 * Type guard to narrow SseEvent to a specific event type
 * @example
 * if (isDataMessage(msg, 'kubb:plugin:start')) {
 *   // msg.event.data is now typed as [plugin: { name: string }]
 *   const pluginName = msg.event.data[0].name
 * }
 */
export function isDataMessage<T extends KubbEvent>(msg: AgentMessage, type?: T): msg is DataMessage<T> {
  return msg.type === 'data' && (type ? msg.payload.type === type : true)
}

export function isConnectedMessage(msg: AgentMessage): msg is ConnectedMessage {
  return msg.type === 'connected'
}

export function isErrorMessage(msg: AgentMessage): msg is ErrorMessage {
  return msg.type === 'error'
}

export function isPingMessage(msg: AgentMessage): msg is PingMessage {
  return msg.type === 'ping'
}

export function isPongMessage(msg: AgentMessage): msg is PongMessage {
  return msg.type === 'pong'
}

export function isStatusMessage(msg: AgentMessage): msg is StatusMessage {
  return msg.type === 'status'
}

export function isDisconnectMessage(msg: AgentMessage): msg is DisconnectMessage {
  return msg.type === 'disconnect'
}

export function isPublishCommandMessage(msg: AgentMessage): msg is CommandMessage & { command: 'publish' } {
  return msg.type === 'command' && (msg as CommandMessage & { command: string }).command === 'publish'
}
