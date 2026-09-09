import { spawn } from 'node:child_process'

/**
 * How one formatter or linter is invoked: the executable, the argv it takes for an output
 * directory, and what to report when it is not installed.
 */
export type ToolCommand = {
  command: string
  args: (outputPath: string) => Array<string>
  errorMessage: string
}

/**
 * CLI command descriptors for each supported code formatter.
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
} as const satisfies Record<string, ToolCommand>

/**
 * CLI command descriptors for each supported linter.
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
} as const satisfies Record<string, ToolCommand>

/**
 * Preference order for `format: 'auto'`, most-preferred first. Spelled out rather than taken from
 * the table's key order, which is arbitrary and would silently change what `auto` picks.
 */
export const FORMATTER_PREFERENCE = ['oxfmt', 'biome', 'prettier'] as const

/**
 * Preference order for `lint: 'auto'`, most-preferred first.
 */
export const LINTER_PREFERENCE = ['oxlint', 'biome', 'eslint'] as const

/**
 * Whether `name` is on PATH and answers `--version` with a zero exit.
 */
export function isToolAvailable(name: string): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(name, ['--version'], { stdio: 'ignore' })
    child.on('close', (code) => resolve(code === 0))
    child.on('error', () => resolve(false))
  })
}

/**
 * Returns the first installed executable from `candidates`, or `null` when none are found.
 *
 * Not memoized: a long-running host that probes repeatedly should cache the result itself, and a
 * `--watch` build should keep noticing a tool installed mid-session.
 */
export async function detectTool<TName extends string>(candidates: ReadonlyArray<TName>): Promise<TName | null> {
  for (const candidate of candidates) {
    if (await isToolAvailable(candidate)) {
      return candidate
    }
  }

  return null
}

/**
 * Tokenizes a shell command string, respecting single and double quotes.
 *
 * @example
 * ```ts
 * tokenize('git commit -m "initial commit"')
 * // → ['git', 'commit', '-m', 'initial commit']
 * ```
 */
export function tokenize(command: string): Array<string> {
  return (command.match(/[^\s"']+|"([^"]*)"|'([^']*)'/g) ?? []).map((token) => token.replace(/^["']|["']$/g, ''))
}
