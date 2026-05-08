import { KUBB_CONFIG_FILENAME } from '@internals/shared'
export { KUBB_CONFIG_FILENAME }

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
export const QUIET_FLAGS = new Set(['--help', '-h', '--version', '-v'] as const)

export const agentDefaults = {
  port: '3000',
  host: 'localhost',
  configFile: KUBB_CONFIG_FILENAME,
  retryTimeout: '30000',
  studioUrl: 'https://kubb.studio',
  /**
   * Relative path from the @kubb/agent package root to the server entry.
   */
  serverEntryPath: '.output/server/index.mjs',
} as const

/**
 * Color palette used by randomCliColor() for deterministic plugin name coloring.
 */
