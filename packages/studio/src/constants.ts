/**
 * Stable defaults the Studio client falls back to when a host passes nothing. Where a config lives
 * is deliberately absent: each host resolves that its own way.
 */
/**
 * The hosted Kubb Studio. Exported because a host that stores credentials has to bind them to a
 * resolved URL, so it cannot leave the default to the client.
 */
export const defaultStudioUrl = 'https://kubb.studio'

export const agentDefaults = {
  studioUrl: defaultStudioUrl,
  retryIntervalMs: 30_000,
  heartbeatIntervalMs: 30_000,
  poolSize: 1,
} as const

/**
 * Upper bound for the heartbeat interval, including the `KUBB_AGENT_HEARTBEAT_INTERVAL` override.
 * Studio counts an agent as offline when its last ping is older than 90 seconds
 * (`AGENT_PING_STALE_MS` in kubb.studio), so a slower cadence would make a healthy
 * agent invisible in the active-agents list. The two values are one contract.
 */
export const maxHeartbeatIntervalMs = agentDefaults.heartbeatIntervalMs
