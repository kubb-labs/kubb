import { getFileSource } from './managers/fileManager/index.ts'
import { PluginManager } from './managers/pluginManager/index.ts'
import { clean, createLogger, isURL, pc, read } from './utils/index.ts'
import { isPromise } from './utils/isPromise.ts'

import type { File } from './managers/fileManager/index.ts'
import type { OnExecute } from './managers/pluginManager/index.ts'
import type { BuildOutput, KubbPlugin, PluginContext, TransformResult } from './types.ts'
import type { QueueTask, Logger } from './utils/index.ts'

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

  _plugin: KubbPlugin
): Promise<string | null> {
  return result
}

export async function build(options: BuildOptions): Promise<BuildOutput> {
  const { config, logger = createLogger() } = options

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

  const queueTask = async (id: string, file: File) => {
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

    const { hookName, plugin } = executer

    if (config.logLevel === 'info') {
      const messsage = `🪂 Executing ${hookName || 'unknown'}(${pc.yellow(plugin.name || 'unknown')})`
      logger.log(messsage)
    }
  }

  const pluginManager = new PluginManager(config, { logger, task: queueTask as QueueTask<File>, onExecute })
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
