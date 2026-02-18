/**
 * WebSocket message types for agent communication protocol
 *
 * Messages flow bidirectionally between Studio backend and CLI agents:
 * - Studio → Agent: CommandMessage (generate, connect)
 * - Agent → Studio: ConnectedMessage, DataMessage, PingMessage
 * - Studio → Agent: PongMessage
 * - Bidirectional: ErrorMessage, StatusMessage
 */

import type { InfoResponse, SseEvent } from '@kubb/core'

/**
 * Command message sent from Studio to Agent
 * Triggers actions like code generation or connection establishment
 */
export type CommandMessage = {
  type: 'command'
  command: 'generate' | 'connect'
}

/**
 * Connected message sent from Agent to Studio
 * Includes agent info like supported plugins and version
 */
export type ConnectedMessage = {
  type: 'connected'
  payload: InfoResponse
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

/**
 * Data message containing code generation events
 * Wraps Kubb SSE events for real-time generation progress
 */
export type DataMessage = {
  type: 'data'
  event: SseEvent
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

export function isDataMessage(msg: AgentMessage): msg is DataMessage {
  return msg.type === 'data'
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
