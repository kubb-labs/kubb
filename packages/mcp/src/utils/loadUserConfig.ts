import { existsSync } from 'node:fs'
import path from 'node:path'
import type { Config } from '@kubb/core'
import { unrun } from 'unrun'
import { ALLOWED_CONFIG_EXTENSIONS } from '../constants.ts'
import { NotifyTypes } from '../types.ts'

type NotifyFunction = (type: string, message: string, data?: Record<string, unknown>) => Promise<void>

const loadedModules = new Map<string, unknown>()

async function loadModule(filePath: string): Promise<unknown> {
  const ext = path.extname(filePath)
  if (!ALLOWED_CONFIG_EXTENSIONS.has(ext)) {
    throw new Error(`Invalid config file extension "${ext}". Allowed: ${[...ALLOWED_CONFIG_EXTENSIONS].join(', ')}`)
  }
  if (loadedModules.has(filePath)) {
    return loadedModules.get(filePath)
  }
  const { module } = await unrun({ path: filePath })
  loadedModules.set(filePath, module)
  return module
}

export async function loadUserConfig(configPath: string | undefined, { notify }: { notify: NotifyFunction }): Promise<{ userConfig: Config; cwd: string }> {
  let userConfig: Config | undefined
  let cwd: string

  if (configPath) {
    const ext = path.extname(configPath)
    if (!ALLOWED_CONFIG_EXTENSIONS.has(ext)) {
      const msg = `Invalid config file extension "${ext}". Allowed: ${[...ALLOWED_CONFIG_EXTENSIONS].join(', ')}`
      await notify(NotifyTypes.CONFIG_ERROR, msg)
      throw new Error(msg)
    }
    const base = path.resolve(process.cwd())
    const resolvedConfigPath = path.resolve(base, configPath)
    const relative = path.relative(base, resolvedConfigPath)
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      const msg = 'Invalid config file path: must be within the current working directory'
      await notify(NotifyTypes.CONFIG_ERROR, msg)
      throw new Error(msg)
    }
    cwd = path.dirname(resolvedConfigPath)

    try {
      userConfig = (await loadModule(resolvedConfigPath)) as Config
      await notify(NotifyTypes.CONFIG_LOADED, `Loaded config from ${resolvedConfigPath}`)
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
        userConfig = (await loadModule(configFilePath)) as Config
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
