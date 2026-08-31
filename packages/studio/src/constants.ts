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
  /**
   * Maximum heartbeat interval. Studio drops agents from the active list after ~90s without a ping,
   * so a slower override would make a healthy agent look dead.
   */
  heartbeatIntervalMs: 30_000,
  poolSize: 1,
} as const
