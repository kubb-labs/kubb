import type { FileNode } from '@kubb/ast'

/**
 * Base URL for the Kubb Studio web app.
 */
export const DEFAULT_STUDIO_URL = 'https://studio.kubb.dev' as const

/**
 * Maximum number of files processed in parallel by FileProcessor.
 */
export const PARALLEL_CONCURRENCY_LIMIT = 100

/**
 * Default banner style written at the top of every generated file.
 */
export const DEFAULT_BANNER = 'simple' as const

/**
 * Default file-extension mapping used when no explicit mapping is configured.
 */
export const DEFAULT_EXTENSION: Record<FileNode['extname'], FileNode['extname'] | ''> = { '.ts': '.ts' }

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
