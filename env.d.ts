declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'

      /**
       * Standard opt-out flag used by many developer tools to disable telemetry.
       * Set to "1" or "true" to disable Kubb CLI telemetry.
       * @see https://consoledonottrack.com
       * @example "1"
       */
      DO_NOT_TRACK: string | undefined

      /**
       * Kubb-specific flag to disable telemetry.
       * Set to "1" or "true" to disable Kubb CLI telemetry.
       * @example "1"
       */
      KUBB_DISABLE_TELEMETRY: string | undefined

      /**
       * BetterStack Logtail source endpoint URL for shipping server logs to BetterStack.
       * @example "https://otlp.kubb.dev"
       */
      OTEL_EXPORTER_OTLP_ENDPOINT: string | undefined

      /**
       * BetterStack Logtail source token for shipping server logs to BetterStack.
       * @example "your-logtail-source-token-here"
       */
      OTLP_TOKEN: string | undefined

      // CI environment detection variables
      /** Set by GitHub Actions */
      GITHUB_ACTIONS: string | undefined
      /** Set by GitLab CI */
      GITLAB_CI: string | undefined
      /** Set by Bitbucket Pipelines */
      BITBUCKET_BUILD_NUMBER: string | undefined
      /** Set by Jenkins */
      JENKINS_URL: string | undefined
      /** Set by CircleCI */
      CIRCLECI: string | undefined
      /** Set by Travis CI */
      TRAVIS: string | undefined
      /** Set by TeamCity */
      TEAMCITY_VERSION: string | undefined
      /** Set by Buildkite */
      BUILDKITE: string | undefined
      /** Set by Azure Pipelines */
      TF_BUILD: string | undefined

      /**
       * HTTP port the agent server listens on.
       * @default "3000"
       */
      PORT: string | undefined

      /**
       * Root directory the agent uses for file resolution and code generation
       * output. Relative paths are resolved from `process.cwd()`.
       * @default process.cwd()
       * @example "./"
       */
      KUBB_AGENT_ROOT: string | undefined

      /**
       * Bearer token issued by Studio when registering an agent.
       * Required for the agent to authenticate with Studio.
       */
      KUBB_AGENT_TOKEN: string

      /**
       * Path to the Kubb configuration file, relative to `KUBB_AGENT_ROOT`.
       * @default "kubb.config.ts"
       */
      KUBB_AGENT_CONFIG: string | undefined

      /**
       * Milliseconds the agent waits before attempting to reconnect after an
       * unexpected WebSocket disconnect.
       * @default "30000"
       */
      KUBB_AGENT_RETRY_TIMEOUT: string | undefined

      /**
       * When `"true"`, allows the agent to write generated files to disk
       * alongside `kubb.config.ts`.
       * @default "false"
       */
      KUBB_AGENT_ALLOW_WRITE: string | undefined

      /**
       * When `"true"`, grants the agent all permissions (implies
       * `KUBB_AGENT_ALLOW_WRITE`).
       * @default "false"
       */
      KUBB_AGENT_ALLOW_ALL: string | undefined

      /**
       * When `"true"`, allows the agent to run the publish command (e.g. `npm publish`).
       * Implies the user has configured an `.npmrc` or equivalent credentials on the agent.
       * @default "false"
       */
      KUBB_AGENT_ALLOW_PUBLISH: string | undefined

      /**
       * Default shell command used when a publish is triggered without an explicit command in the WebSocket payload.
       * @default "npm publish"
       * @example "npm publish --access public"
       */
      KUBB_AGENT_PUBLISH_COMMAND: string | undefined

      /**
       * URL of the Kubb Studio instance the agent connects to.
       * Used as the base for WebSocket session URLs.
       * @default "https://studio.kubb.dev"
       * @example "https://studio.example.com"
       */
      KUBB_STUDIO_URL: string

      /**
       * Fixed machine identifier used for Polar license key activation.
       * In Docker environments MAC addresses and hostnames are
       * ephemeral and change on every container recreation, which would trigger a
       * new activation on each restart and exhaust the allowed Polar activation slots.
       * Set this to a stable value (e.g. a UUID) to ensure a consistent identity.
       * When omitted, the ID is derived from network interface MACs + hostname.
       * @example "550e8400-e29b-41d4-a716-446655440000"
       */
      KUBB_AGENT_SECRET: string
      /**
       * Interval in milliseconds for sending heartbeat pings to Kubb Studio to keep the WebSocket connection alive.
       * @default "30000"
       */
      KUBB_AGENT_HEARTBEAT_INTERVAL: string | undefined

      /**
       * The number of isolated sessions to create for Studio users.
       * Each session corresponds to a WebSocket connection and an agent instance with its own permissions and file system access.
       * This allows multiple users to connect to the same agent server without interfering with each other's sessions.
       * @default "1"
       */
      KUBB_AGENT_POOL_SIZE: string | undefined

      /**
       * URL to call every 5 minutes to signal the agent is still alive.
       * Intended for use with uptime-monitoring services such as Healthchecks.io, BetterUptime, or UptimeRobot.
       * Leave unset to disable the heartbeat.
       * @example "https://hc-ping.com/your-uuid-here"
       */
      KUBB_AGENT_HEARTBEAT_URL: string | undefined
    }
  }
}

export {}
