import path from 'node:path'
import process from 'node:process'
import type { defineConfig, UserConfig } from '@kubb/core'
import { createJiti } from 'jiti'

export type CosmiconfigResult = {
  filepath: string
  isEmpty?: boolean
  config: ReturnType<typeof defineConfig> | UserConfig
}

/**
 * Load a TypeScript or JavaScript Kubb config file using jiti for on-the-fly transpilation.
 * Supports JSX via `@kubb/react-fabric` and resolves the default export.
 */
const tsLoader = async (configFile: string) => {
  const jiti = createJiti(import.meta.url, {
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

/**
 * Load a Kubb config file from the given path, resolving relative paths against `process.cwd()`.
 * Supports both `.ts` and `.js` config files.
 */
export async function getCosmiConfig(configPath: string): Promise<CosmiconfigResult> {
  try {
    // Resolve relative paths to absolute
    const absolutePath = path.isAbsolute(configPath) ? configPath : path.resolve(process.cwd(), configPath)

    const mod = await tsLoader(absolutePath)
    return {
      filepath: absolutePath,
      config: mod,
    }
  } catch (error: any) {
    throw new Error('Config failed loading', { cause: error })
  }
}
