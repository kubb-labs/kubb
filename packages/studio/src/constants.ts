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
  poolSize: 1,
} as const
