/**
 * Stable defaults used by the agent runtime when no environment overrides are provided.
 */
export const agentDefaults = {
  studioUrl: "https://studio.kubb.dev",
  configPath: "kubb.config.ts",
  retryIntervalMs: 30_000,
  heartbeatIntervalMs: 30_000,
  poolSize: 1,
} as const;

/**
 * WebSocket timing and protocol details used by the Studio connection.
 */
export const websocketDefaults = {
  connectTimeoutMs: 5_000,
  closeCode: {
    timeout: 3008,
  },
  closeReason: {
    timeout: "Connection timeout",
  },
} as const;
