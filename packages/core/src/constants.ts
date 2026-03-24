import type { KubbFile } from '@kubb/fabric-core/types'

/**
 * Base URL for the Kubb Studio web app.
 */
export const DEFAULT_STUDIO_URL = 'https://studio.kubb.dev' as const

/**
 * Internal plugin name used to identify the core Kubb runtime.
 */
export const CORE_PLUGIN_NAME = 'core' as const

/**
 * Maximum number of event-emitter listeners before Node.js emits a warning.
 */
export const DEFAULT_MAX_LISTENERS = 100

/**
 * Default number of plugins that may run concurrently during a build.
 */
export const DEFAULT_CONCURRENCY = 15

/**
 * File name used for generated barrel (index) files.
 */
export const BARREL_FILENAME = 'index.ts' as const

/**
 * Default banner style written at the top of every generated file.
 */
export const DEFAULT_BANNER = 'simple' as const

/**
 * Default file-extension mapping used when no explicit mapping is configured.
 */
export const DEFAULT_EXTENSION: Record<KubbFile.Extname, KubbFile.Extname | ''> = { '.ts': '.ts' }

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

/**
 * CLI command descriptors for each supported linter.
 *
 * Each entry contains the executable `command`, an `args` factory that maps an
 * output path to the correct argument list, and an `errorMessage` shown when
 * the linter is not found.
 */
export const linters = {
  eslint: {
    command: 'eslint',
    args: (outputPath: string) => [outputPath, '--fix'],
    errorMessage: 'Eslint not found',
  },
  biome: {
    command: 'biome',
    args: (outputPath: string) => ['lint', '--fix', outputPath],
    errorMessage: 'Biome not found',
  },
  oxlint: {
    command: 'oxlint',
    args: (outputPath: string) => ['--fix', outputPath],
    errorMessage: 'Oxlint not found',
  },
} as const

/**
 * CLI command descriptors for each supported code formatter.
 *
 * Each entry contains the executable `command`, an `args` factory that maps an
 * output path to the correct argument list, and an `errorMessage` shown when
 * the formatter is not found.
 */
export const formatters = {
  prettier: {
    command: 'prettier',
    args: (outputPath: string) => ['--ignore-unknown', '--write', outputPath],
    errorMessage: 'Prettier not found',
  },
  biome: {
    command: 'biome',
    args: (outputPath: string) => ['format', '--write', outputPath],
    errorMessage: 'Biome not found',
  },
  oxfmt: {
    command: 'oxfmt',
    args: (outputPath: string) => [outputPath],
    errorMessage: 'Oxfmt not found',
  },
} as const
