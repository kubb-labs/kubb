import path from 'node:path'
import process from 'node:process'
import type { PossibleConfig } from '@kubb/core'
import { createJiti } from 'jiti'
import { logger } from '~/utils/logger.ts'

export type CosmiconfigResult = {
  filepath: string
  isEmpty?: boolean
  config: PossibleConfig
}

const jiti = createJiti(import.meta.url, {
  jsx: {
    runtime: 'automatic',
    importSource: '@kubb/renderer-jsx',
  },
  moduleCache: false,
})

const tsLoader = async (configFile: string) => {
  return jiti.import(configFile, { default: true }) as any
}

export async function getCosmiConfig(configPath: string): Promise<CosmiconfigResult> {
  try {
    const absolutePath = path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath)

    const mod = await tsLoader(absolutePath)
    return {
      filepath: absolutePath,
      config: mod,
    }
  } catch (error: any) {
    logger.error(`Config failed loading ${error?.message ?? error}`)

    throw new Error('Config failed loading', { cause: error })
  }
}
