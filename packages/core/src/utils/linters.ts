import { x } from 'tinyexec'
import type { linters } from '../constants.ts'

type Linter = keyof typeof linters

/**
 * Returns `true` when the given linter is installed and callable.
 *
 * Availability is detected by running `<linter> --version` and checking
 * that the process exits without error.
 */
async function isLinterAvailable(linter: Linter): Promise<boolean> {
  try {
    await x(linter, ['--version'], { nodeOptions: { stdio: 'ignore' } })
    return true
  } catch {
    return false
  }
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
