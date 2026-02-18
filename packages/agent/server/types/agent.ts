// WebSocket message types for agent communication

import type { InfoResponse, SseEventType } from '@kubb/core'

export type CommandMessage = {
  type: 'command'
  id: string
  command: 'generate'
}

export type ConnectedMessage = {
  type: 'connected'
  id: string
  payload: InfoResponse
}

export type ErrorMessage = {
  type: 'error'
  message: string
}

export type PingMessage = {
  type: 'ping'
}

export type PongMessage = {
  type: 'ping'
}

export type StatusMessage = {
  type: 'status'
  message: string
  connectedAgents: number
  agents: Array<{
    id: string
    name: string
    connectedAt: string
  }>
}

/**
 * SSE events
 */
export type DataMessage = {
  type: 'data'
  id: string
  event: SseEventType
  /**
   * this will be SseEvent
   */
  payload: string
}

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
