// WebSocket message types for agent communication

import type { InfoResponse } from '@kubb/core'

export type CommandMessage = {
  type: 'command'
  id: string
  command: 'generate'
  payload: Record<string, unknown>
}

export type LogMessage = {
  type: 'log'
  id: string
  message: string
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

export type ProgressMessage = {
  type: 'progress'
  id: string
  value: number
}

export type ResultMessage = {
  type: 'result'
  id: string
  success: boolean
  error?: string
}

export type AgentConnectResponse = {
  sessionId: string
  userId: string
  agentId: string
  wsUrl: string
  expiresAt: string
}

export type AgentMessage = CommandMessage | LogMessage | ProgressMessage | ResultMessage | ConnectedMessage | ErrorMessage | StatusMessage | PingMessage

// Helper type guards
export function isCommandMessage(msg: AgentMessage): msg is CommandMessage {
  return msg.type === 'command'
}

export function isLogMessage(msg: AgentMessage): msg is LogMessage {
  return msg.type === 'log'
}

export function isProgressMessage(msg: AgentMessage): msg is ProgressMessage {
  return msg.type === 'progress'
}

export function isResultMessage(msg: AgentMessage): msg is ResultMessage {
  return msg.type === 'result'
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
