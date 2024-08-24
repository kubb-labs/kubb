import c from 'tinyrainbow'

import { clean, read, write } from '@kubb/fs'
import { type FileManager, processFiles } from './FileManager.ts'
import { PluginManager } from './PluginManager.ts'
import { isInputPath } from './config.ts'
import { createLogger, randomCliColour } from './logger.ts'
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
      throw new Error(
        `Cannot read file/URL defined in \`input.path\` or set with \`kubb generate PATH\` in the CLI of your Kubb config ${c.dim(config.input.path)}`,
        {
          cause: e,
        },
      )
    }
  }

  if (config.output.clean) {
    await clean(config.output.path)
  }

  const pluginManager = new PluginManager(config, { logger })

  pluginManager.on('executed', (executer) => {
    const { hookName, plugin, output, parameters } = executer

    const logs = [
      `${randomCliColour(plugin.name)} Executing ${hookName}`,
      parameters && `${c.bgWhite('Parameters')} ${randomCliColour(plugin.name)} ${hookName}`,
      JSON.stringify(parameters, undefined, 2),
      output && `${c.bgWhite('Output')} ${randomCliColour(plugin.name)} ${hookName}`,
      output,
    ].filter(Boolean)

    logger.emit('debug', logs as string[])
  })

  return pluginManager
}

export async function build(options: BuildOptions): Promise<BuildOutput> {
  const pluginManager = await setup(options)

  await pluginManager.hookParallel({
    hookName: 'buildStart',
    parameters: [options.config],
  })

  const files = await processFiles({
    dryRun: !options.config.output.write,
    files: pluginManager.fileManager.files,
    logger: pluginManager.logger,
  })

  await pluginManager.hookParallel({ hookName: 'buildEnd' })

  return {
    files,
    pluginManager,
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

    files = await processFiles({
      dryRun: !options.config.output.write,
      files: pluginManager.fileManager.files,
      logger: pluginManager.logger,
    })

    await pluginManager.hookParallel({ hookName: 'buildEnd' })
  } catch (e) {
    const files = await processFiles({
      dryRun: true,
      files: pluginManager.fileManager.files,
      logger: pluginManager.logger,
    })

    return {
      files,
      pluginManager,
      error: e as Error,
    }
  }

  return {
    files,
    pluginManager,
  }
}
