import { existsSync } from 'node:fs'
import path from 'node:path'
import type { Config } from '@kubb/core'
import { unrun } from 'unrun'
import { NotifyTypes } from '../types.ts'

type NotifyFunction = (type: string, message: string, data?: Record<string, unknown>) => Promise<void>

export async function loadUserConfig(configPath: string | undefined, { notify }: { notify: NotifyFunction }): Promise<{ userConfig: Config; cwd: string }> {
  let userConfig: Config | undefined
  let cwd: string

  if (configPath) {
    cwd = path.dirname(path.resolve(configPath))

    try {
      const { module } = await unrun({ path: configPath })
      userConfig = module as Config
      await notify(NotifyTypes.CONFIG_LOADED, `Loaded config from ${configPath}`)
    } catch (error) {
      await notify(NotifyTypes.CONFIG_ERROR, `Failed to load config: ${error instanceof Error ? error.message : String(error)}`)
      throw new Error(`Failed to load config: ${error instanceof Error ? error.message : String(error)}`)
    }
  } else {
    cwd = process.cwd()
    const configFileNames = ['kubb.config.ts', 'kubb.config.mts', 'kubb.config.cts', 'kubb.config.js', 'kubb.config.cjs']

    for (const configFileName of configFileNames) {
      const configFilePath = path.resolve(process.cwd(), configFileName)
      if (!existsSync(configFilePath)) continue
      try {
        const { module } = await unrun({ path: configFilePath })
        userConfig = module as Config
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
