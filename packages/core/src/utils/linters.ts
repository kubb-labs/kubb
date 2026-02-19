import { execaCommand } from 'execa'

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
