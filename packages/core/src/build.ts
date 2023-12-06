import c from 'tinyrainbow'

import { clean } from './fs/clean.ts'
import { read } from './fs/read.ts'
import { URLPath } from './utils/URLPath.ts'
import { isInputPath } from './config.ts'
import { FileManager } from './FileManager.ts'
import { createLogger, LogLevel, randomCliColour } from './logger.ts'
import { PluginManager } from './PluginManager.ts'
import { isPromise } from './PromiseManager.ts'

import type { KubbFile } from './FileManager.ts'
import type { Logger } from './logger.ts'
import type { KubbPlugin, PluginContext, PluginParameter, TransformResult } from './types.ts'

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

async function transformReducer(
  this: PluginContext,
  _previousCode: string,
  result: TransformResult | Promise<TransformResult>,
  _plugin: KubbPlugin,
): Promise<string | null> {
  return result
}

async function setup(options: BuildOptions): Promise<PluginManager> {
  const { config, logger = createLogger({ logLevel: LogLevel.silent }) } = options
  let count = 0

  try {
    if (isInputPath(config) && !new URLPath(config.input.path).isURL) {
      await read(config.input.path)
    }
  } catch (e) {
    if (isInputPath(config)) {
      throw new Error(
        'Cannot read file/URL defined in `input.path` or set with `kubb generate PATH` in the CLI of your Kubb config ' + c.dim(config.input.path),
        {
          cause: e,
        },
      )
    }
  }

  if (config.output.clean) {
    await clean(config.output.path)
  }

  const task = async (file: KubbFile.ResolvedFile): Promise<KubbFile.ResolvedFile> => {
    const { path } = file

    let source: string | null = FileManager.getSource(file)

    const { result: loadedResult } = await pluginManager.hookFirst({
      hookName: 'load',
      parameters: [path],
    })
    if (loadedResult && isPromise(loadedResult)) {
      source = await loadedResult
    }
    if (loadedResult && !isPromise(loadedResult)) {
      source = loadedResult
    }

    if (source) {
      source = await pluginManager.hookReduceArg0({
        hookName: 'transform',
        parameters: [source, path],
        reduce: transformReducer,
      })

      if (config.output.write || config.output.write === undefined) {
        if (file.meta?.pluginKey) {
          // run only for pluginKey defined in the meta of the file
          await pluginManager.hookForPlugin({
            pluginKey: file.meta?.pluginKey,
            hookName: 'writeFile',
            parameters: [source, path],
          })
        }

        await pluginManager.hookFirst({
          hookName: 'writeFile',
          parameters: [source, path],
        })
      }
    }

    return {
      ...file,
      source: source || '',
    }
  }

  const pluginManager = new PluginManager(config, { logger, task })

  pluginManager.on('execute', (executer) => {
    const { hookName, parameters, plugin } = executer

    if (hookName === 'writeFile' && logger.spinner) {
      const [code] = parameters as PluginParameter<'writeFile'>

      if (logger.logLevel === LogLevel.debug) {
        logger.debug(`PluginKey ${c.dim(JSON.stringify(plugin.key))} \nwith source\n\n${code}`)
      }
    }
  })

  pluginManager.queue.on('add', () => {
    if (logger.logLevel !== LogLevel.info) {
      return
    }

    if (logger.spinner && count === 0) {
      logger.spinner?.start(`💾 Writing`)
    }
  })

  pluginManager.queue.on('active', () => {
    if (logger.logLevel !== LogLevel.info) {
      return
    }

    if (logger.spinner && pluginManager.queue.size > 0) {
      const text = `Item: ${count} Size: ${pluginManager.queue.size}  Pending: ${pluginManager.queue.pending}`

      logger.spinner.suffixText = c.dim(text)
    }
    ;++count
  })

  pluginManager.queue.on('completed', () => {
    if (logger.logLevel !== LogLevel.info) {
      return
    }

    if (logger.spinner) {
      const text = `Item: ${count} Size: ${pluginManager.queue.size}  Pending: ${pluginManager.queue.pending}`

      logger.spinner.suffixText = c.dim(text)
    }
  })

  pluginManager.on('executed', (executer) => {
    const { hookName, plugin, output, parameters } = executer

    if (logger.logLevel === LogLevel.debug) {
      const logs = [
        `${randomCliColour(plugin.name)} Executing ${hookName}`,
        parameters && `${c.bgWhite(`Parameters`)} ${randomCliColour(plugin.name)} ${hookName}`,
        JSON.stringify(parameters, undefined, 2),
        output && `${c.bgWhite('Output')} ${randomCliColour(plugin.name)} ${hookName}`,
        output,
      ].filter(Boolean)

      logger.debug(logs.join('\n'))
    }
  })

  return pluginManager
}

export async function build(options: BuildOptions): Promise<BuildOutput> {
  const pluginManager = await setup(options)

  const { fileManager, logger } = pluginManager

  await pluginManager.hookParallel({
    hookName: 'buildStart',
    parameters: [options.config],
  })

  await pluginManager.hookParallel({ hookName: 'buildEnd' })

  if (logger.logLevel === LogLevel.info && logger.spinner) {
    logger.spinner.suffixText = ''
    logger.spinner.succeed(`💾 Writing completed`)
  }

  return { files: fileManager.files.map((file) => ({ ...file, source: FileManager.getSource(file) })), pluginManager }
}

export async function safeBuild(options: BuildOptions): Promise<BuildOutput> {
  const pluginManager = await setup(options)

  const { fileManager, logger } = pluginManager

  try {
    await pluginManager.hookParallel({
      hookName: 'buildStart',
      parameters: [options.config],
    })

    await pluginManager.hookParallel({ hookName: 'buildEnd' })

    if (logger.logLevel === LogLevel.info && logger.spinner) {
      logger.spinner.suffixText = ''
      logger.spinner.succeed(`💾 Writing completed`)
    }
  } catch (e) {
    return { files: fileManager.files.map((file) => ({ ...file, source: FileManager.getSource(file) })), pluginManager, error: e as Error }
  }

  return { files: fileManager.files.map((file) => ({ ...file, source: FileManager.getSource(file) })), pluginManager }
}
