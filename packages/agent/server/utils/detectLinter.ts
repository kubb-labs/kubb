import { execaCommand } from 'execa'

type Linter = 'biome' | 'oxlint' | 'eslint'

async function isLinterAvailable(linter: Linter): Promise<boolean> {
  try {
    await execaCommand(`${linter} --version`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export async function detectLinter(): Promise<Linter | undefined> {
  const linters: Linter[] = ['biome', 'oxlint', 'eslint']

  for (const linter of linters) {
    if (await isLinterAvailable(linter)) {
      return linter
    }
  }

  return undefined
}
