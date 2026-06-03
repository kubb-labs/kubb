import { spawn } from 'node:child_process'

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
    // Oxlint still honors `.gitignore` during directory traversal even with `--no-ignore` (which
    // only disables `.eslintignore`), so a gitignored output dir resolves to no files.
    // `--no-error-on-unmatched-pattern` keeps that from failing the run with "No files found to
    // lint"; such a dir is simply skipped rather than linted.
    args: (outputPath: string) => ['--fix', '--no-ignore', '--no-error-on-unmatched-pattern', outputPath],
    errorMessage: 'Oxlint not found',
  },
} as const

type Linter = keyof typeof linters

async function isLinterAvailable(linter: Linter): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn(linter, ['--version'], { stdio: 'ignore' })
    child.on('close', (code) => resolve(code === 0))
    child.on('error', () => resolve(false))
  })
}

/**
 * Detects the first available linter on the current system.
 *
 * - Checks in preference order: `oxlint`, `biome`, `eslint`.
 * - Returns `null` when none are found.
 *
 * @example
 * ```ts
 * const linter = await detectLinter()
 * if (linter) {
 *   console.log(`Using ${linter} for linting`)
 * }
 * ```
 */
export async function detectLinter(): Promise<Linter | null> {
  const linterNames = new Set(['oxlint', 'biome', 'eslint'] as const)

  for (const linter of linterNames) {
    if (await isLinterAvailable(linter)) {
      return linter
    }
  }

  return null
}
