import path from 'node:path'
import process from 'node:process'
import type { defineConfig, UserConfig } from '@kubb/core'
import { createJiti } from 'jiti'

export type CosmiconfigResult = {
  filepath: string
  isEmpty?: boolean
  config: ReturnType<typeof defineConfig> | UserConfig
}

const tsLoader = async (configFile: string) => {
  const jiti = createJiti(configFile, {
    jsx: {
      runtime: 'automatic',
      importSource: '@kubb/react-fabric',
    },
    sourceMaps: true,
    interopDefault: true,
  })

  const mod = await jiti.import(configFile, { default: true })

  return mod as any
}

export async function getCosmiConfig(configPath: string): Promise<CosmiconfigResult> {
  try {
    // Resolve relative paths to absolute
    const absolutePath = path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath)

    const mod = await tsLoader(absolutePath)
    return {
      filepath: absolutePath,
      config: mod,
    }
  } catch (error) {
    throw new Error('Config failed loading', { cause: error })
  }
}
