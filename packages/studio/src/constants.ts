import type { AgentCapacity } from './protocol/index.ts'

/**
 * Hosted Kubb Studio URL. Exported so credential stores can bind tokens to the resolved instance,
 * not whatever default the client would pick on its own.
 */
export const defaultStudioUrl = 'https://kubb.studio'

/**
 * Defaults the Studio client uses when a host passes nothing.
 * Config path is left out on purpose: each host discovers that itself.
 */
export const agentDefaults = {
  studioUrl: defaultStudioUrl,
  retryIntervalMs: 30_000,
  heartbeatIntervalMs: 30_000,
  /**
   * Slowest heartbeat a host may ask for. Studio drops an agent from the active list once its
   * stored ping is older than its liveness window, and it stores a ping at most once a minute, so
   * a slower cadence would make a healthy agent look dead after a single missed ping.
   */
  maxHeartbeatIntervalMs: 60_000,
  /** How long a heartbeat ping may take before the session is treated as dead. */
  heartbeatTimeoutMs: 10_000,
  maxConcurrent: 1,
  maxGenerations: 8,
  maxGenerationsMb: 100,
  maxSnapshotMb: 50,
} as const

function positiveNumber(value: string | undefined): number | undefined {
  const parsed = Number(value)
  return value && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

/**
 * How many generations an agent keeps and how large they may get, read from
 * `KUBB_AGENT_MAX_GENERATIONS`, `KUBB_AGENT_MAX_GENERATIONS_MB` and `KUBB_AGENT_MAX_SNAPSHOT_MB`.
 * An unset or invalid value keeps the default.
 */
export function resolveGenerationLimits(env: NodeJS.ProcessEnv = process.env): { maxCount: number; maxMb: number; maxSnapshotMb: number } {
  return {
    maxCount: Math.max(1, Math.floor(positiveNumber(env.KUBB_AGENT_MAX_GENERATIONS) ?? agentDefaults.maxGenerations)),
    maxMb: positiveNumber(env.KUBB_AGENT_MAX_GENERATIONS_MB) ?? agentDefaults.maxGenerationsMb,
    maxSnapshotMb: positiveNumber(env.KUBB_AGENT_MAX_SNAPSHOT_MB) ?? agentDefaults.maxSnapshotMb,
  }
}


/**
 * How far past its memory budget an agent may grow before it refuses new jobs. The headroom covers
 * the build that pushed it there finishing and handing its memory back.
 */
export const MEMORY_WATERMARK = 1.5

/**
 * An agent's capacity read from `KUBB_AGENT_MAX_CONCURRENT` and `KUBB_AGENT_MEMORY_BUDGET_MB`. An
 * unset or invalid value keeps the default: one job at a time, and no memory budget.
 */
export function resolveAgentCapacity(env: NodeJS.ProcessEnv = process.env): AgentCapacity {
  return {
    maxConcurrent: Math.max(1, Math.floor(positiveNumber(env.KUBB_AGENT_MAX_CONCURRENT) ?? agentDefaults.maxConcurrent)),
    memoryBudgetMb: positiveNumber(env.KUBB_AGENT_MEMORY_BUDGET_MB),
  }
}
