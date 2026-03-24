import { x } from 'tinyexec'
import type { formatters } from '../constants.ts'

type Formatter = keyof typeof formatters

/**
 * Returns `true` when the given formatter is installed and callable.
 *
 * Availability is detected by running `<formatter> --version` and checking
 * that the process exits without error.
 */
async function isFormatterAvailable(formatter: Formatter): Promise<boolean> {
  try {
    await x(formatter, ['--version'], { nodeOptions: { stdio: 'ignore' } })
    return true
  } catch {
    return false
  }
}

/**
 * Detects the first available code formatter on the current system.
 *
 * - Checks in preference order: `biome`, `oxfmt`, `prettier`.
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
  const formatterNames = new Set(['biome', 'oxfmt', 'prettier'] as const)

  for (const formatter of formatterNames) {
    if (await isFormatterAvailable(formatter)) {
      return formatter
    }
  }

  return null
}
