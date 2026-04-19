import path from 'node:path'
import process from 'node:process'
import { agentDefaults } from '../constants.ts'

/**
 * Parses a string environment flag using the agent's boolean convention.
 */
function parseBooleanEnv(value: string | undefined): boolean {
  return value === 'true'
}

/**
 * Parses a positive integer from the environment and falls back when the value is absent or invalid.
 */
function parsePositiveIntegerEnv(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export type StudioRuntimeConfig = {
  studioUrl: string
  token: string | undefined
  configPath: string
  resolvedConfigPath: string
  retryInterval: number
  heartbeatInterval: number
  root: string
  allowAll: boolean
  allowWrite: boolean
  allowPublish: boolean
  poolSize: number
  hasSecret: boolean
}

/**
 * Resolves the runtime configuration consumed by the Studio integration from environment variables.
 */
export function resolveStudioRuntimeConfig(env: NodeJS.ProcessEnv = process.env, cwd: string = process.cwd()): StudioRuntimeConfig {
  const root = env.KUBB_AGENT_ROOT ?? cwd
  const configPath = env.KUBB_AGENT_CONFIG ?? agentDefaults.configPath
  const allowAll = parseBooleanEnv(env.KUBB_AGENT_ALLOW_ALL)

  return {
    studioUrl: env.KUBB_STUDIO_URL ?? agentDefaults.studioUrl,
    token: env.KUBB_AGENT_TOKEN,
    configPath,
    resolvedConfigPath: path.isAbsolute(configPath) ? configPath : path.resolve(root, configPath),
    retryInterval: parsePositiveIntegerEnv(env.KUBB_AGENT_RETRY_TIMEOUT, agentDefaults.retryIntervalMs),
    heartbeatInterval: parsePositiveIntegerEnv(env.KUBB_AGENT_HEARTBEAT_INTERVAL, agentDefaults.heartbeatIntervalMs),
    root,
    allowAll,
    allowWrite: allowAll || parseBooleanEnv(env.KUBB_AGENT_ALLOW_WRITE),
    allowPublish: allowAll || parseBooleanEnv(env.KUBB_AGENT_ALLOW_PUBLISH),
    poolSize: parsePositiveIntegerEnv(env.KUBB_AGENT_POOL_SIZE, agentDefaults.poolSize),
    hasSecret: Boolean(env.KUBB_AGENT_SECRET),
  }
}
