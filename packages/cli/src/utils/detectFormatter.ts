import { execaCommand } from 'execa'

type Formatter = 'biome' | 'prettier' | 'oxfmt'

/**
 * Check if a formatter command is available in the system.
 *
 * @param formatter - The formatter to check ('biome', 'prettier', or 'oxfmt')
 * @returns Promise that resolves to true if the formatter is available, false otherwise
 *
 * @remarks
 * This function checks availability by running `<formatter> --version` command.
 * All supported formatters (biome, prettier, oxfmt) implement the --version flag.
 */
async function isFormatterAvailable(formatter: Formatter): Promise<boolean> {
  try {
    // Try to get the version of the formatter to check if it's installed
    await execaCommand(`${formatter} --version`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Detect which formatter is available in the system.
 *
 * @returns Promise that resolves to the first available formatter or undefined if none are found
 *
 * @remarks
 * Checks in order of preference: biome, oxfmt, prettier.
 * Uses the `--version` flag to detect if each formatter command is available.
 * This is a reliable method as all supported formatters implement this flag.
 *
 * @example
 * ```typescript
 * const formatter = await detectFormatter()
 * if (formatter) {
 *   console.log(`Using ${formatter} for formatting`)
 * } else {
 *   console.log('No formatter found')
 * }
 * ```
 */
export async function detectFormatter(): Promise<Formatter | undefined> {
  const formatters: Formatter[] = ['biome', 'oxfmt', 'prettier']

  for (const formatter of formatters) {
    if (await isFormatterAvailable(formatter)) {
      return formatter
    }
  }

  return undefined
}
