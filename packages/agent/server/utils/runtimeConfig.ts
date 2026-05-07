import path from 'node:path'
import process from 'node:process'
import { agentDefaults } from '../constants.ts'

type PermissionLevel = 'none' | 'read' | 'write'

function parseBooleanEnv(value: string | undefined): boolean {
  return value === 'true'
}

function parsePermissionEnv(value: string | undefined): PermissionLevel {
  if (value === 'write' || value === 'true') return 'write'
  if (value === 'read') return 'read'
  return 'none'
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
  yolo: boolean
  filesystem: PermissionLevel
  poolSize: number
  hasSecret: boolean
}

/**
 * Resolves the runtime configuration consumed by the Studio integration from environment variables.
 */
export function resolveStudioRuntimeConfig(env: NodeJS.ProcessEnv = process.env, cwd: string = process.cwd()): StudioRuntimeConfig {
  const root = env.KUBB_AGENT_ROOT ?? cwd
  const configPath = env.KUBB_AGENT_CONFIG ?? agentDefaults.configPath
  const yolo = parseBooleanEnv(env.KUBB_PERMISSION_YOLO)

  return {
    studioUrl: env.KUBB_STUDIO_URL ?? agentDefaults.studioUrl,
    token: env.KUBB_AGENT_TOKEN,
    configPath,
    resolvedConfigPath: path.isAbsolute(configPath) ? configPath : path.resolve(root, configPath),
    retryInterval: parsePositiveIntegerEnv(env.KUBB_AGENT_RETRY_TIMEOUT, agentDefaults.retryIntervalMs),
    heartbeatInterval: parsePositiveIntegerEnv(env.KUBB_AGENT_HEARTBEAT_INTERVAL, agentDefaults.heartbeatIntervalMs),
    root,
    yolo,
    filesystem: yolo ? 'write' : parsePermissionEnv(env.KUBB_PERMISSION_FILESYSTEM),
    poolSize: parsePositiveIntegerEnv(env.KUBB_AGENT_POOL_SIZE, agentDefaults.poolSize),
    hasSecret: Boolean(env.KUBB_AGENT_SECRET),
  }
}
