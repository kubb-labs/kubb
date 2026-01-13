import path from 'node:path'
import type { Config } from '@kubb/core'
import createJiti from 'jiti'
import { NotifyTypes } from '../types.ts'

type NotifyFunction = (type: string, message: string, data?: Record<string, unknown>) => Promise<void>

const jiti = createJiti(import.meta.url, {
  sourceMaps: true,
})

/**
 * Load the user configuration from the specified path or current directory
 */
export async function loadUserConfig(configPath: string | undefined, { notify }: { notify: NotifyFunction }): Promise<{ userConfig: Config; cwd: string }> {
  let userConfig: Config
  let cwd: string

  if (configPath) {
    // Resolve the config path to absolute path and get its directory
    cwd = path.dirname(path.resolve(configPath))

    // Try to load from path
    try {
      userConfig = await jiti.import(configPath, { default: true })
      await notify(NotifyTypes.CONFIG_LOADED, `Loaded config from ${configPath}`)
    } catch (error) {
      await notify(NotifyTypes.CONFIG_ERROR, `Failed to load config: ${error instanceof Error ? error.message : String(error)}`)
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`)
    }
  } else {
    // Look for kubb.config.ts in current directory
    cwd = process.cwd()

    try {
      userConfig = await jiti.import(path.resolve(process.cwd(), 'kubb.config.ts'), { default: true })
      await notify(NotifyTypes.CONFIG_LOADED, 'Loaded kubb.config.ts from current directory')
    } catch {
      await notify(NotifyTypes.CONFIG_ERROR, 'No config file found')
      throw new Error('No config file found. Please provide a config path or create kubb.config.ts')
    }
  }

  return { userConfig, cwd }
}
