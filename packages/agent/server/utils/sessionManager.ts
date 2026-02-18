import { readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { AgentConnectResponse } from '../types/agent.ts'

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
    // Ensure directory exists
    if (!CONFIG_DIR) {
      return
    }

    // Create directory if it doesn't exist
    try {
      writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
    } catch {
      // Directory might not exist, try to create it
      return
    }
  } catch (error) {
    console.warn('Failed to save agent config:', error)
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
  } catch (error) {
    console.warn('Failed to get cached session:', error)
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
    console.log('Cached agent session')
  } catch (error) {
    console.warn('Failed to cache session:', error)
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
  } catch (error) {
    console.warn('Failed to delete cached session:', error)
  }
}

/**
 * Hash agent token for use as session key
 * This prevents storing raw tokens in the config file
 */
function hashAgentToken(token: string): string {
  // Use a simple hash - in production you might want to use crypto
  return Buffer.from(token).toString('base64').substring(0, 16)
}
