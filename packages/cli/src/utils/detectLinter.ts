import { execaCommand } from 'execa'

type Linter = 'biome' | 'oxlint' | 'eslint'

/**
 * Check if a linter command is available in the system.
 *
 * @param linter - The linter to check ('biome', 'oxlint', or 'eslint')
 * @returns Promise that resolves to true if the linter is available, false otherwise
 *
 * @remarks
 * This function checks availability by running `<linter> --version` command.
 * All supported linters (biome, oxlint, eslint) implement the --version flag.
 */
async function isLinterAvailable(linter: Linter): Promise<boolean> {
  try {
    // Try to get the version of the linter to check if it's installed
    await execaCommand(`${linter} --version`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/**
 * Detect which linter is available in the system.
 *
 * @returns Promise that resolves to the first available linter or undefined if none are found
 *
 * @remarks
 * Checks in order of preference: biome, oxlint, eslint.
 * Uses the `--version` flag to detect if each linter command is available.
 * This is a reliable method as all supported linters implement this flag.
 *
 * @example
 * ```typescript
 * const linter = await detectLinter()
 * if (linter) {
 *   console.log(`Using ${linter} for linting`)
 * } else {
 *   console.log('No linter found')
 * }
 * ```
 */
export async function detectLinter(): Promise<Linter | undefined> {
  const linters: Linter[] = ['biome', 'oxlint', 'eslint']

  for (const linter of linters) {
    if (await isLinterAvailable(linter)) {
      return linter
    }
  }

  return undefined
}
