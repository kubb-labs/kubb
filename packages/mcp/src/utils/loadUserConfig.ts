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
  let userConfig: Config | undefined
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
    // Look for kubb.config in current directory with various extensions
    cwd = process.cwd()
    const configFileNames = ['kubb.config.ts', 'kubb.config.js', 'kubb.config.cjs']

    for (const configFileName of configFileNames) {
      try {
        const configFilePath = path.resolve(process.cwd(), configFileName)
        userConfig = await jiti.import(configFilePath, { default: true })
        await notify(NotifyTypes.CONFIG_LOADED, `Loaded ${configFileName} from current directory`)
        break
      } catch {
        // Continue trying next config file
      }
    }

    if (!userConfig) {
      await notify(NotifyTypes.CONFIG_ERROR, 'No config file found')

      throw new Error(`No config file found. Please provide a config path or create one of: ${configFileNames.join(', ')}`)
    }
  }

  return { userConfig: userConfig!, cwd }
}
