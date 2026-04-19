import type { FileNode } from '@kubb/ast'

/**
 * Base URL for the Kubb Studio web app.
 */
export const DEFAULT_STUDIO_URL = 'https://studio.kubb.dev' as const

/**
 * Default number of plugins that may run concurrently during a build.
 */
export const DEFAULT_CONCURRENCY = 15

/**
 * Maximum number of files processed in parallel by FileProcessor.
 */
export const PARALLEL_CONCURRENCY_LIMIT = 100

/**
 * Basename (without extension) of generated barrel files.
 *
 * Used to detect whether a path already points at a barrel so the generator
 * avoids re-creating one on top of it.
 */
export const BARREL_BASENAME = 'index' as const

/**
 * File name used for generated barrel (index) files.
 */
export const BARREL_FILENAME = `${BARREL_BASENAME}.ts` as const

/**
 * Default banner style written at the top of every generated file.
 */
export const DEFAULT_BANNER = 'simple' as const

/**
 * Default file-extension mapping used when no explicit mapping is configured.
 */
export const DEFAULT_EXTENSION: Record<FileNode['extname'], FileNode['extname'] | ''> = { '.ts': '.ts' }

/**
 * Characters recognized as path separators on both POSIX and Windows.
 */
export const PATH_SEPARATORS = new Set(['/', '\\'] as const)

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
