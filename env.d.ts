declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
      /**
       * HTTP port the agent server listens on.
       * @default "3000"
       */
      PORT: string

      /**
       * Root directory the agent uses for file resolution and code generation
       * output. Relative paths are resolved from `process.cwd()`.
       * @default process.cwd()
       * @example "./"
       */
      KUBB_AGENT_ROOT: string

      /**
       * Bearer token issued by Studio when registering an agent.
       * Required for the agent to authenticate with Studio.
       */
      KUBB_AGENT_TOKEN: string

      /**
       * Path to the Kubb configuration file, relative to `KUBB_AGENT_ROOT`.
       * @default "kubb.config.ts"
       */
      KUBB_AGENT_CONFIG: string

      /**
       * When `"true"`, disables session caching in `~/.kubb/config.json` so
       * each run starts fresh.
       * @default "false"
       */
      KUBB_AGENT_NO_CACHE: string

      /**
       * Milliseconds the agent waits before attempting to reconnect after an
       * unexpected WebSocket disconnect.
       * @default "30000"
       */
      KUBB_AGENT_RETRY_TIMEOUT: string

      /**
       * When `"true"`, allows the agent to write generated files to disk
       * alongside `kubb.config.ts`.
       * @default "false"
       */
      KUBB_AGENT_ALLOW_WRITE: string

      /**
       * When `"true"`, grants the agent all permissions (implies
       * `KUBB_AGENT_ALLOW_WRITE`).
       * @default "false"
       */
      KUBB_AGENT_ALLOW_ALL: string

      /**
       * Kubb Studio license key. Must be set to a valid key in production.
       * @default "KUBB_STUDIO-00000000-0000-0000-0000-000000000000" (development placeholder)
       */
      KUBB_STUDIO_LICENSE: string

      /**
       * URL of the Kubb Studio instance the agent connects to.
       * Used as the base for WebSocket session URLs.
       * @default "https://studio.kubb.dev"
       * @example "https://studio.example.com"
       */
      KUBB_STUDIO_URL: string

      /**
       * Fixed machine identifier used for Polar license key activation.
       * In Docker / containerised environments MAC addresses and hostnames are
       * ephemeral and change on every container recreation, which would trigger a
       * new activation on each restart and exhaust the allowed Polar activation slots.
       * Set this to a stable value (e.g. a UUID) to ensure a consistent identity.
       * When omitted, the ID is derived from network interface MACs + hostname.
       * @example "550e8400-e29b-41d4-a716-446655440000"
       */
      KUBB_STUDIO_MACHINE_NAME: string | undefined
    }
  }
}

export {}
