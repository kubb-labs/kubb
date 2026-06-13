import { spawn } from 'node:child_process'

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
    // --no-ignore so oxlint lints the folder even when it's gitignored (generated output dirs usually are).
    args: (outputPath: string) => ['--fix', '--no-ignore', outputPath],
    errorMessage: 'Oxlint not found',
  },
} as const

/**
 * Resolves to `true` when running `tool --version` exits with code 0.
 */
async function isToolAvailable(tool: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(tool, ['--version'], { stdio: 'ignore' })
    child.on('close', (code) => resolve(code === 0))
    child.on('error', () => resolve(false))
  })
}

/**
 * Returns the first installed tool from `candidates`, checked in order, or `null` when none are found.
 *
 * Availability is probed by running `<tool> --version` and checking for a zero exit code.
 *
 * @example
 * ```ts
 * const formatter = await detectTool(['oxfmt', 'biome', 'prettier'] as const)
 * const linter = await detectTool(['oxlint', 'biome', 'eslint'] as const)
 * ```
 */
export async function detectTool<TName extends string>(candidates: ReadonlyArray<TName>): Promise<TName | null> {
  for (const tool of candidates) {
    if (await isToolAvailable(tool)) {
      return tool
    }
  }

  return null
}
