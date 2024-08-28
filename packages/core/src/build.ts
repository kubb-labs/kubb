import { clean, read } from '@kubb/fs'
import { type FileManager, processFiles } from './FileManager.ts'
import { PluginManager } from './PluginManager.ts'
import { isInputPath } from './config.ts'
import { createLogger } from './logger.ts'
import { URLPath } from './utils/URLPath.ts'

import type { Logger } from './logger.ts'
import type { PluginContext } from './types.ts'

type BuildOptions = {
  config: PluginContext['config']
  /**
   * @default Logger without the spinner
   */
  logger?: Logger
}

type BuildOutput = {
  files: FileManager['files']
  pluginManager: PluginManager
  /**
   * Only for safeBuild
   */
  error?: Error
}

async function setup(options: BuildOptions): Promise<PluginManager> {
  const { config, logger = createLogger() } = options

  try {
    if (isInputPath(config) && !new URLPath(config.input.path).isURL) {
      await read(config.input.path)
    }
  } catch (e) {
    if (isInputPath(config)) {
      throw new Error(`Cannot read file/URL defined in \`input.path\` or set with \`kubb generate PATH\` in the CLI of your Kubb config ${config.input.path}`, {
        cause: e,
      })
    }
  }

  if (config.output.clean) {
    await clean(config.output.path)
  }

  return new PluginManager(config, { logger })
}

export async function build(options: BuildOptions): Promise<BuildOutput> {
  const { files, pluginManager, error } = await safeBuild(options)

  if (error) throw error

  return {
    files,
    pluginManager,
    error,
  }
}

export async function safeBuild(options: BuildOptions): Promise<BuildOutput> {
  const pluginManager = await setup(options)
  let files = []

  try {
    await pluginManager.hookParallel({
      hookName: 'buildStart',
      parameters: [options.config],
    })

    //TODO set extName here instead of the files, extName is private. All exports will have extName, it's up the the process to hide.override the name
    files = await processFiles({
      config: options.config,
      dryRun: !options.config.output.write,
      files: pluginManager.fileManager.files,
      logger: pluginManager.logger,
    })

    await pluginManager.hookParallel({ hookName: 'buildEnd' })
  } catch (e) {
    return {
      files: [],
      pluginManager,
      error: e as Error,
    }
  }

  return {
    files,
    pluginManager,
  }
}
