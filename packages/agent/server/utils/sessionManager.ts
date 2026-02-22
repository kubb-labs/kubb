import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { AgentConnectResponse } from '../types/agent.ts'
import { logger } from './logger.ts'

const CONFIG_DIR = path.join(os.homedir(), '.kubb')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

export interface AgentSession extends AgentConnectResponse {
  storedAt: string
}

export interface AgentConfig {
  sessions?: Record<string, AgentSession>
}

/**
 * Load the agent configuration from ~/.kubb/config.json
 */
export function loadAgentConfig(): AgentConfig {
  try {
    const content = readFileSync(CONFIG_FILE, 'utf-8')
    return JSON.parse(content)
  } catch (_error) {
    // File doesn't exist or is invalid JSON
    return { sessions: {} }
  }
}

/**
 * Save the agent configuration to ~/.kubb/config.json
 */
export function saveAgentConfig(config: AgentConfig): void {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true })
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
  } catch (_error) {
    logger.warn('Failed to save agent config')
  }
}

/**
 * Check if a session is still valid based on expiresAt
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

/**
 * Get a cached session for a given agent token
 * Returns null if session doesn't exist or is expired
 */
export function getCachedSession(agentToken: string): AgentSession | null {
  try {
    const config = loadAgentConfig()
    const sessionKey = hashAgentToken(agentToken)
    const session = config.sessions?.[sessionKey]

    if (!session) {
      return null
    }

    if (!isSessionValid(session)) {
      // Session expired, remove it
      deleteCachedSession(agentToken)
      return null
    }

    return session
  } catch (_error) {
    logger.warn('Failed to get cached session')
    return null
  }
}

/**
 * Store a session for reuse
 */
export function cacheSession(agentToken: string, session: AgentConnectResponse): void {
  try {
    const config = loadAgentConfig()
    const sessionKey = hashAgentToken(agentToken)

    if (!config.sessions) {
      config.sessions = {}
    }

    config.sessions[sessionKey] = {
      ...session,
      storedAt: new Date().toISOString(),
    }

    saveAgentConfig(config)
    logger.success('Cached agent session')
  } catch (_error) {
    logger.warn('Failed to cache session')
  }
}

/**
 * Delete a cached session
 */
export function deleteCachedSession(agentToken: string): void {
  try {
    const config = loadAgentConfig()
    const sessionKey = hashAgentToken(agentToken)

    if (config.sessions?.[sessionKey]) {
      delete config.sessions[sessionKey]
      saveAgentConfig(config)
    }
  } catch (_error) {
    logger.warn('Failed to delete cached session')
  }
}

/**
 * Hash an agent token using SHA-512
 * Tokens are hashed before storage for security - raw tokens are never persisted
 */
function hashAgentToken(token: string): string {
  return createHash('sha512').update(token).digest('hex')
}
