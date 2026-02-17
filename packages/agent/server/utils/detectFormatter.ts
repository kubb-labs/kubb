import { execaCommand } from 'execa'

type Formatter = 'biome' | 'prettier' | 'oxfmt'

async function isFormatterAvailable(formatter: Formatter): Promise<boolean> {
  try {
    await execaCommand(`${formatter} --version`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

export async function detectFormatter(): Promise<Formatter | undefined> {
  const formatters: Formatter[] = ['biome', 'oxfmt', 'prettier']

  for (const formatter of formatters) {
    if (await isFormatterAvailable(formatter)) {
      return formatter
    }
  }

  return undefined
}
