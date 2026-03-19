import { x } from 'tinyexec'
import type { linters } from '../constants.ts'

type Linter = keyof typeof linters

async function isLinterAvailable(linter: Linter): Promise<boolean> {
  try {
    await x(linter, ['--version'], { nodeOptions: { stdio: 'ignore' } })
    return true
  } catch {
    return false
  }
}

export async function detectLinter(): Promise<Linter | undefined> {
  const linterNames = new Set(['biome', 'oxlint', 'eslint'] as const)

  for (const linter of linterNames) {
    if (await isLinterAvailable(linter)) {
      return linter
    }
  }

  return undefined
}
