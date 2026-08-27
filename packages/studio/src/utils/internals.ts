import { spawn } from 'node:child_process'

/**
 * Tokenizes a shell command string, respecting single and double quotes.
 *
 * @example
 * tokenize('git commit -m "initial commit"')
 * // → ['git', 'commit', '-m', 'initial commit']
 */
export function tokenize(command: string): Array<string> {
  return (command.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) ?? []).map((token) => token.replace(/^["']|["']$/g, ''))
}

/**
 * Returns a masked version of a string, showing only the first and last few characters.
 * Useful for logging sensitive values (tokens, keys) without exposing the full value.
 *
 * @example
 * maskString('KUBB_STUDIO-abc123-xyz789') // 'KUBB_STUDIO-…789'
 */
export function maskString(value: string, start = 8, end = 4): string {
  if (value.length <= start + end) return value
  return `${value.slice(0, start)}…${value.slice(-end)}`
}

async function isExecutableAvailable(name: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(name, ['--version'], { stdio: 'ignore' })
    child.on('close', (code) => resolve(code === 0))
    child.on('error', () => resolve(false))
  })
}

/**
 * Returns the first executable from `names` found on the current system, or `null` when none are found.
 */
export async function detectExecutable<TName extends string>(names: Array<TName>): Promise<TName | null> {
  for (const name of names) {
    if (await isExecutableAvailable(name)) {
      return name
    }
  }

  return null
}

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


