/**
 * Default filename for the Kubb configuration file.
 *
 * Used by the `init` command when scaffolding new projects and by the `agent` default config.
 */
export const KUBB_CONFIG_FILENAME = 'kubb.config.ts' as const

/**
 * NPM registry endpoint used to check for @kubb/cli updates.
 */
export const KUBB_NPM_PACKAGE_URL = 'https://registry.npmjs.org/@kubb/cli/latest' as const

/**
 * OpenTelemetry ingestion endpoint for anonymous usage telemetry.
 */
export const OTLP_ENDPOINT = 'https://otlp.kubb.dev' as const

/**
 * Horizontal rule rendered above/below the plain-logger generation summary.
 */
export const SUMMARY_SEPARATOR = '─'.repeat(27)

/**
 * Maximum number of █ characters in a plugin timing bar.
 */
export const SUMMARY_MAX_BAR_LENGTH = 10 as const

/**
 * Divides elapsed milliseconds into bar-length units (1 block per 100 ms).
 */
export const SUMMARY_TIME_SCALE_DIVISOR = 100 as const

/**
 * Glob pattern for paths the file watcher ignores.
 */
export const WATCHER_IGNORED_PATHS = '**/{.git,node_modules}/**' as const

/**
 * Flags that short-circuit execution (help/version) — no telemetry notice is shown.
 */
export const QUITE_FLAGS = new Set(['--help', '-h', '--version', '-v'] as const)

/**
 * Flags accepted by the `generate` command.
 */
export const GENERATE_FLAGS = new Set(['--config', '-c', '--log-level', '-l', '--watch', '-w', '--debug', '-d', '--verbose', '-v', '--silent', '-s'] as const)

/**
 * Flags accepted by the `validate` command.
 */
export const VALIDATE_FLAGS = new Set(['--input', '-i'] as const)

/**
 * Flags accepted by the `init` command.
 */
export const INIT_FLAGS = new Set(['--yes', '-y'] as const)

/**
 * Flags accepted by the `agent start` command.
 */
export const AGENT_START_FLAGS = new Set(['--config', '-c', '--port', '-p', '--host', '--allow-write', '--allow-all'] as const)

/**
 * All known CLI flags across every command.
 */
export const ARGS = new Set([...QUITE_FLAGS, ...GENERATE_FLAGS, ...VALIDATE_FLAGS, ...INIT_FLAGS, ...AGENT_START_FLAGS] as const)

export const agentDefaults = {
  port: '3000',
  host: 'localhost',
  configFile: KUBB_CONFIG_FILENAME,
  retryTimeout: '30000',
  studioUrl: 'https://studio.kubb.dev',
  /**
   * Relative path from the @kubb/agent package root to the server entry.
   */
  serverEntryPath: '.output/server/index.mjs',
} as const

/**
 * Default values used during interactive `init` scaffolding.
 */
export const initDefaults = {
  inputPath: './openapi.yaml',
  outputPath: './src/gen',
  plugins: ['plugin-oas', 'plugin-ts'],
} as const

/**
 * Maps each plugin value to the default config snippet inserted by `init`.
 * The `satisfies` constraint ensures all values remain plain strings while
 * `as const` keeps the object deeply immutable.
 */
export const pluginDefaultConfigs = {
  'plugin-oas': 'pluginOas()',
  'plugin-ts': `pluginTs({
      output: { path: 'models' },
    })`,
  'plugin-client': `pluginClient({
      output: { path: 'clients' },
    })`,
  'plugin-react-query': `pluginReactQuery({
      output: { path: 'hooks' },
    })`,
  'plugin-solid-query': `pluginSolidQuery({
      output: { path: 'hooks' },
    })`,
  'plugin-svelte-query': `pluginSvelteQuery({
      output: { path: 'hooks' },
    })`,
  'plugin-vue-query': `pluginVueQuery({
      output: { path: 'hooks' },
    })`,
  'plugin-swr': `pluginSwr({
      output: { path: 'hooks' },
    })`,
  'plugin-zod': `pluginZod({
      output: { path: 'zod' },
    })`,
  'plugin-faker': `pluginFaker({
      output: { path: 'mocks' },
    })`,
  'plugin-msw': `pluginMsw({
      output: { path: 'msw' },
    })`,
} as const satisfies Record<string, string>

/**
 * Color palette used by randomCliColor() for deterministic plugin name coloring.
 */
