/**
 * WebSocket message types for agent communication protocol
 *
 * Messages flow bidirectionally between Studio backend and CLI agents:
 * - Studio → Agent: CommandMessage (generate, connect)
 * - Agent → Studio: ConnectedMessage, DataMessage, PingMessage
 * - Studio → Agent: PongMessage
 * - Bidirectional: ErrorMessage, StatusMessage
 */

import type { Config } from '@kubb/core'
import type { KubbFile } from '@kubb/fabric-core/types'

/**
 * Typed events sent by the Kubb agent.
 * Follows the same tuple structure as {@link KubbEvents}.
 */
export type KubbEvents = {
  'plugin:start': [plugin: { name: string }]
  'plugin:end': [plugin: { name: string }, meta: { duration: number; success: boolean }]
  'files:processing:start': [meta: { total: number }]
  'file:processing:update': [
    meta: {
      file: string
      processed: number
      total: number
      percentage: number
    },
  ]
  'files:processing:end': [meta: { total: number }]
  info: [message: string, info?: string]
  success: [message: string, info?: string]
  warn: [message: string, info?: string]
  error: [error: { message: string; stack?: string }]
  'generation:start': [config: { name?: string; plugins: number }]
  'generation:end': [Config: Config, files: Array<KubbFile.ResolvedFile>, sources: Record<KubbFile.Path, string>]
  'lifecycle:end': []
}

type KubbEvent = keyof KubbEvents

/**
 * Command message sent from Studio to Agent
 * Triggers actions like code generation or connection establishment
 */
export type CommandMessage = {
  type: 'command'
  command: 'generate' | 'connect'
}

type ConnectMessagePayload = {
  version: string
  configPath: string
  spec?: string
  config: {
    name?: string
    root: string
    input: {
      path?: string
    }
    output: {
      path: string
      write?: boolean
      extension?: Record<string, string>
      barrelType?: string | false
    }
    plugins?: Array<{
      name: string
      options: unknown
    }>
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
  type: 'error'
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
  revokedAt: string
  sessionToken: string
}

export type AgentMessage = CommandMessage | DataMessage | ConnectedMessage | ErrorMessage | StatusMessage | PingMessage | PongMessage

// Helper type guards
export function isCommandMessage(msg: AgentMessage): msg is CommandMessage {
  return msg.type === 'command'
}

/**
 * Type guard to narrow SseEvent to a specific event type
 * @example
 * if (isDataMessage(msg, 'plugin:start')) {
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

export function isStatusMessage(msg: AgentMessage): msg is StatusMessage {
  return msg.type === 'status'
}
