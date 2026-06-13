/**
 * NPM registry endpoint used to check for @kubb/cli updates.
 */
export const KUBB_NPM_PACKAGE_URL = 'https://registry.npmjs.org/@kubb/cli/latest' as const

/**
 * OpenTelemetry ingestion endpoint for anonymous usage telemetry.
 */
export const OTLP_ENDPOINT = 'https://otlp.kubb.dev' as const

/**
 * Glob pattern for paths the file watcher ignores.
 */
export const WATCHER_IGNORED_PATHS = '**/{.git,node_modules}/**' as const

/**
 * Flags that short-circuit execution (help/version), no telemetry notice is shown.
 */
export const QUIET_FLAGS = new Set<string>(['--help', '-h', '--version', '-v'])
