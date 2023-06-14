/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { getFileSource } from './managers/fileManager/index.ts'
import { PluginManager } from './managers/pluginManager/index.ts'
import { clean, createLogger, isURL, randomPicoColour, read } from './utils/index.ts'
import { isPromise } from './utils/isPromise.ts'
import pc from 'picocolors'

import type { File, ResolvedFile } from './managers/fileManager/index.ts'
import type { OnExecute } from './managers/pluginManager/index.ts'
import type { BuildOutput, KubbPlugin, PluginContext, TransformResult } from './types.ts'
import type { QueueTask, Logger } from './utils/index.ts'

type BuildOptions = {
  config: PluginContext['config']
  /**
   * @default Logger without the spinner
   */
  logger?: Logger
  debug?: boolean
}

async function transformReducer(
  this: PluginContext,
  _previousCode: string,
  result: TransformResult | Promise<TransformResult>,

  _plugin: KubbPlugin
): Promise<string | null> {
  return result
}

export async function build(options: BuildOptions): Promise<BuildOutput> {
  const { config, debug, logger = createLogger() } = options

  try {
    if (!isURL(config.input.path)) {
      await read(config.input.path)
    }
  } catch (e: any) {
    throw new Error('Cannot read file/URL defined in `input.path` or set with --input in the CLI of your Kubb config', { cause: e })
  }

  if (config.output.clean) {
    await clean(config.output.path)
  }

  const queueTask = async (file: File) => {
    const { path } = file

    let code: string | null = getFileSource(file)

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
        await pluginManager.hookParallel({
          hookName: 'writeFile',
          parameters: [transformedCode, path],
        })
      }
    }
  }

  const onExecute: OnExecute = (executer) => {
    if (!executer) {
      return
    }

    const { hookName, plugin, output, input } = executer

    // only log execution information when we have `info` logLevel set and the hook used has an input
    if (config.logLevel === 'info' && logger?.spinner && input) {
      const messsage = `${randomPicoColour(plugin.name)} Executing ${hookName}`

      if (debug) {
        logger.info(messsage)
        const logs = [input && pc.green('Input:'), JSON.stringify(input, undefined, 2), output && pc.green('Output:'), output].filter(Boolean)
        console.log(logs.join('\n'))
      } else {
        logger.spinner.suffixText = messsage
      }
    }
  }

  const pluginManager = new PluginManager(config, { debug, logger, task: queueTask as QueueTask<ResolvedFile>, onExecute })
  const { plugins, fileManager } = pluginManager

  await pluginManager.hookParallel<'validate', true>({
    hookName: 'validate',
    parameters: [plugins],
  })

  await pluginManager.hookParallel({
    hookName: 'buildStart',
    parameters: [config],
  })

  await pluginManager.hookParallel({ hookName: 'buildEnd' })

  return { files: fileManager.files.map((file) => ({ ...file, source: getFileSource(file) })), pluginManager }
}
