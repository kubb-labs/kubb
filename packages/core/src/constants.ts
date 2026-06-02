/**
 * Base URL for the Kubb Studio web app.
 */
export const DEFAULT_STUDIO_URL = 'https://kubb.studio' as const

/**
 * Number of file writes to batch in parallel during `flushPendingFiles`.
 */
export const STREAM_FLUSH_EVERY = 50

/**
 * Number of schema/operation nodes to dispatch concurrently during generation.
 */
export const SCHEMA_PARALLEL = 8

/**
 * Plugin `include` filter types that select operations directly. When one of these is set
 * without a `schemaName` include, the generate phase pre-scans operations to compute the set
 * of schemas they reach, so unreachable schemas can be pruned for that plugin.
 */
export const OPERATION_FILTER_TYPES: ReadonlySet<string> = new Set(['tag', 'operationId', 'path', 'method', 'contentType'])

/**
 * Numeric log-level thresholds used internally to compare verbosity.
 *
 * Higher numbers are more verbose.
 */
export const logLevel = {
  silent: Number.NEGATIVE_INFINITY,
  error: 0,
  warn: 1,
  info: 3,
  verbose: 4,
  debug: 5,
} as const
