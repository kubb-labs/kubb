import { execaCommand } from 'execa'

type Linter = 'biome' | 'oxlint' | 'eslint'

/**
 * Check if a linter command is available in the system
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
 * Checks in order of preference: biome, oxlint, eslint.
 * Returns the first available linter or undefined if none are found.
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
