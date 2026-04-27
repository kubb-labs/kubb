import path from 'node:path'
import process from 'node:process'
import type { PossibleConfig } from '@kubb/core'
import { unrun } from 'unrun'
import { logger } from '~/utils/logger.ts'

export type CosmiconfigResult = {
  filepath: string
  isEmpty?: boolean
  config: PossibleConfig
}

const unrunInputOptions = {
  transform: {
    jsx: {
      runtime: 'automatic' as const,
      importSource: '@kubb/renderer-jsx',
    },
  },
}

const tsLoader = async (configFile: string) => {
  const { module } = await unrun({
    path: configFile,
    inputOptions: unrunInputOptions,
  })

  return module as any
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
