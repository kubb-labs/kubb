import pc from 'picocolors'

import { createFileSource } from './managers/fileManager/index.ts'
import { PluginManager } from './managers/pluginManager/index.ts'
import { clean, createLogger, randomPicoColour, read, URLPath } from './utils/index.ts'
import { isPromise } from './utils/isPromise.ts'
import { isInputPath } from './config.ts'
import { LogLevel } from './types.ts'

import type { KubbFile } from './managers/fileManager/index.ts'
import type { PluginParameter } from './managers/pluginManager/types.ts'
import type { BuildOutput, KubbPlugin, PluginContext, TransformResult } from './types.ts'
import type { Logger, QueueJob } from './utils/index.ts'

type BuildOptions = {
  config: PluginContext['config']
  /**
   * @default Logger without the spinner
   */
  logger?: Logger
}

async function transformReducer(
  this: PluginContext,
  _previousCode: string,
  result: TransformResult | Promise<TransformResult>,
  _plugin: KubbPlugin,
): Promise<string | null> {
  return result
}

export async function build(options: BuildOptions): Promise<BuildOutput> {
  const { config, logger = createLogger({ logLevel: LogLevel.silent }) } = options

  try {
    if (isInputPath(config) && !new URLPath(config.input.path).isURL) {
      await read(config.input.path)
    }
  } catch (e) {
    if (isInputPath(config)) {
      throw new Error(
        'Cannot read file/URL defined in `input.path` or set with `kubb generate PATH` in the CLI of your Kubb config ' + pc.dim(config.input.path),
        {
          cause: e,
        },
      )
    }
  }

  if (config.output.clean) {
    await clean(config.output.path)
  }

  const queueTask = async (file: KubbFile.File) => {
    const { path } = file

    let code: string | null = createFileSource(file)

    const { result: loadedResult } = await pluginManager.hookFirst({
      hookName: 'load',
      parameters: [path],
    })
    if (loadedResult && isPromise(loadedResult)) {
      code = await loadedResult
    }
    if (loadedResult && !isPromise(loadedResult)) {
      code = loadedResult
    }

    if (code) {
      const transformedCode = await pluginManager.hookReduceArg0({
        hookName: 'transform',
        parameters: [code, path],
        reduce: transformReducer,
      })

      if (config.output.write || config.output.write === undefined) {
        if (file.meta?.pluginKey) {
          // run only for pluginKey defined in the meta of the file
          return pluginManager.hookForPlugin({
            pluginKey: file.meta?.pluginKey,
            hookName: 'writeFile',
            parameters: [transformedCode, path],
          })
        }

        return pluginManager.hookFirst({
          hookName: 'writeFile',
          parameters: [transformedCode, path],
        })
      }
    }
  }

  const pluginManager = new PluginManager(config, { logger, task: queueTask as QueueJob<KubbFile.ResolvedFile>, writeTimeout: 0 })
  const { plugins, fileManager } = pluginManager

  pluginManager.on('execute', (executer) => {
    const { hookName, parameters, plugin } = executer

    if (hookName === 'writeFile' && logger.spinner) {
      const [code] = parameters as PluginParameter<'writeFile'>

      if (logger.logLevel === LogLevel.info) {
        logger.spinner.start(`💾 Writing`)
      }

      if (logger.logLevel === 'debug') {
        logger.info(`PluginKey ${pc.dim(JSON.stringify(plugin.key))} \nwith source\n\n${code}`)
      }
    }
  })

  pluginManager.on('executed', (executer) => {
    const { hookName, plugin, output, parameters } = executer
    const messsage = `${randomPicoColour(plugin.name)} Executing ${hookName}`

    if (logger.logLevel === LogLevel.info && logger.spinner) {
      if (hookName === 'writeFile') {
        const [_code, path] = parameters as PluginParameter<'writeFile'>

        logger.spinner.suffixText = pc.dim(path)
      } else {
        logger.spinner.suffixText = messsage
      }
    }

    if (logger.logLevel === LogLevel.debug) {
      logger.info(messsage)
      const logs = [
        parameters && `${pc.bgWhite(`Parameters`)} ${randomPicoColour(plugin.name)} ${hookName}`,
        JSON.stringify(parameters, undefined, 2),
        output && `${pc.bgWhite('Output')} ${randomPicoColour(plugin.name)} ${hookName}`,
        output,
      ].filter(Boolean)

      console.log(logs.join('\n'))
    }
  })

  await pluginManager.hookParallel<'validate', true>({
    hookName: 'validate',
    parameters: [plugins],
  })

  await pluginManager.hookParallel({
    hookName: 'buildStart',
    parameters: [config],
  })

  await pluginManager.hookParallel({ hookName: 'buildEnd' })

  if (!fileManager.isExecuting && logger.spinner) {
    logger.spinner.suffixText = ''
    logger.spinner.succeed(`💾 Writing completed`)
  }

  return { files: fileManager.files.map((file) => ({ ...file, source: createFileSource(file) })), pluginManager }
}
