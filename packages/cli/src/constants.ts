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
 * Quiet window in milliseconds that collapses a burst of watcher events (an editor save emits
 * several) into a single rebuild.
 */
export const WATCHER_DEBOUNCE_MS = 100

/**
 * Interval in milliseconds between polls of a remote `input` URL in watch mode. A remote document
 * emits no filesystem events, so watch mode falls back to fetching it and comparing bodies.
 */
export const URL_WATCHER_INTERVAL_MS = 2_000

/**
 * Upper bound in milliseconds for a single URL watcher request, covering both the response headers
 * and the body read. A server that hangs mid-response would otherwise stall polling forever.
 */
export const URL_WATCHER_TIMEOUT_MS = 10_000

/**
 * Upper bound in milliseconds for the npm update check, so a slow registry never stalls a run.
 */
export const UPDATE_CHECK_TIMEOUT_MS = 3_000

/**
 * Flags that short-circuit execution (help and version). The telemetry notice is suppressed for these.
 */
export const QUIET_FLAGS = new Set<string>(['--help', '-h', '--version', '-v'])
