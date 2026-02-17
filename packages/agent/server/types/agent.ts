// WebSocket message types for agent communication

import type { InfoResponse } from "@kubb/core";

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

export type InfoMessage = {
  type: 'info'
  id: string
  payload: InfoResponse
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

export type AgentMessage = CommandMessage | LogMessage | ProgressMessage | ResultMessage | InfoMessage

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

export function isInfoMessage(msg: AgentMessage): msg is InfoMessage {
  return msg.type === 'info'
}
