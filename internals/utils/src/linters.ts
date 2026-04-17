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
    args: (outputPath: string) => ['--fix', outputPath],
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
 * - Checks in preference order: `biome`, `oxlint`, `eslint`.
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
  const linterNames = new Set(['biome', 'oxlint', 'eslint'] as const)

  for (const linter of linterNames) {
    if (await isLinterAvailable(linter)) {
      return linter
    }
  }

  return null
}
