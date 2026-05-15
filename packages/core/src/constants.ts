import type { FileNode } from '@kubb/ast'

/**
 * Base URL for the Kubb Studio web app.
 */
export const DEFAULT_STUDIO_URL = 'https://kubb.studio' as const

/**
 * Maximum number of files processed in parallel by FileProcessor.
 *
 * Capped at 16 to bound the number of CodeNode trees that are alive simultaneously
 * during rendering; I/O latency is the real bottleneck so higher values offer no
 * meaningful throughput improvement.
 */
export const PARALLEL_CONCURRENCY_LIMIT = 16

/**
 * Default banner style written at the top of every generated file.
 */
export const DEFAULT_BANNER = 'simple' as const

/**
 * Default file-extension mapping used when no explicit mapping is configured.
 */
export const DEFAULT_EXTENSION: Record<FileNode['extname'], FileNode['extname'] | ''> = { '.ts': '.ts' }

/**
 * Schema count above which the adapter's `stream()` path is used instead of `parse()`.
 */
export const STREAM_SCHEMA_THRESHOLD = 100

/**
 * In streaming mode, flush generated files to disk every N schemas to bound in-memory file buffers.
 */
export const FLUSH_EVERY = 50

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
