import { createHash } from 'node:crypto'
import type { AgentConnectResponse, JSONKubbConfig } from '~/types/agent.ts'
import { logger } from '../utils/logger.ts'
import { maskedString } from './maskedString.ts'

type Config = { config: JSONKubbConfig; storedAt: string }

function getStorage() {
  return useStorage<AgentSession>('kubb')
}

export interface AgentSession extends AgentConnectResponse {
  storedAt: string
  configs: Config[]
}

/**
 * Check if a session is still valid based on expiresAt.
 */
function isSessionValid(session: AgentSession): boolean {
  try {
    const expiresAt = new Date(session.expiresAt)
    const now = new Date()
    // Add 1 minute buffer to avoid using expired sessions
    return now.getTime() < expiresAt.getTime() - 60000
  } catch {
    return false
  }
}

/**
 * Returns the storage key for a given agent token.
 * Tokens are hashed with SHA-512 before storage - raw tokens are never persisted.
 */
export function getSessionKey(token: string): string {
  return `sessions:${createHash('sha512').update(token).digest('hex')}`
}

/**
 * Retrieves a cached session if valid, otherwise returns null.
 */
export async function getCachedSession(sessionKey: string): Promise<AgentSession | null> {
  const storage = getStorage()
  const agentSession = await storage.getItem(sessionKey)

  if (!agentSession) {
    return null
  }

  if (!isSessionValid(agentSession)) {
    return null
  }

  return agentSession
}

/**
 * Saves a session to cache.
 */
export async function cacheSession({ sessionKey, session }: { sessionKey: string; session: AgentSession }): Promise<void> {
  const storage = getStorage()
  await storage.setItem(sessionKey, { ...session, storedAt: new Date().toISOString(), configs: [] })
}

/**
 * Removes a session from cache.
 */
export async function removeCachedSession(sessionKey: string): Promise<void> {
  const storage = getStorage()
  logger.info(`[${maskedString(sessionKey)}] Removing expired agent session from cache...`)

  await storage.removeItem(sessionKey)

  logger.success(`[${maskedString(sessionKey)}] Removed expired agent session from cache`)
}

/**
 * Saves studio config to storage with a unique timestamp-based key.
 * Each generation gets its own versioned entry for history/undo purposes.
 */
export async function saveStudioConfigToStorage({ sessionKey, config }: { sessionKey: string; config: JSONKubbConfig }): Promise<void> {
  const storage = getStorage()
  const agentSession = await getCachedSession(sessionKey)

  if (!agentSession) {
    throw new Error('No valid session found for retrieving previous configs')
  }

  await storage.setItem(sessionKey, { ...agentSession, configs: [...agentSession.configs, { config, storedAt: new Date().toISOString() }] })
}
