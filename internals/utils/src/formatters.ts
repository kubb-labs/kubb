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
  oxfmt: {
    command: 'oxfmt',
    args: (outputPath: string) => [outputPath],
    errorMessage: 'Oxfmt not found',
  },
} as const

type Formatter = keyof typeof formatters

async function isFormatterAvailable(formatter: Formatter): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(formatter, ['--version'], { stdio: 'ignore' })
    child.on('close', (code) => resolve(code === 0))
    child.on('error', () => resolve(false))
  })
}

/**
 * Detects the first available code formatter on the current system.
 *
 * - Checks in preference order: `oxfmt`, `prettier`.
 * - Returns `null` when none are found.
 *
 * @example
 * ```ts
 * const formatter = await detectFormatter()
 * if (formatter) {
 *   console.log(`Using ${formatter} for formatting`)
 * }
 * ```
 */
export async function detectFormatter(): Promise<Formatter | null> {
  const formatterNames = new Set(['oxfmt', 'prettier'] as const)

  for (const formatter of formatterNames) {
    if (await isFormatterAvailable(formatter)) {
      return formatter
    }
  }

  return null
}
