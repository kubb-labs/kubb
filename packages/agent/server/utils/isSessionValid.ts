import type { AgentConnectResponse } from '../types/agent.ts'

export interface AgentSession extends AgentConnectResponse {
  storedAt: string
}

/**
 * Check if a session is still valid based on expiresAt.
 */
export function isSessionValid(session: AgentSession): boolean {
  try {
    const expiresAt = new Date(session.expiresAt)
    const now = new Date()
    // Add 1 minute buffer to avoid using expired sessions
    return now.getTime() < expiresAt.getTime() - 60000
  } catch {
    return false
  }
}
