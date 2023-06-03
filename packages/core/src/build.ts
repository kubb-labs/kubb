/* eslint-disable no-async-promise-executor */
import { PluginManager } from './managers/pluginManager/index.ts'
import { clean } from './utils/index.ts'
import { getFileSource } from './managers/fileManager/index.ts'

import type { FileManager, File } from './managers/fileManager/index.ts'
import type { QueueTask } from './utils/index.ts'
import type { PluginContext, TransformResult, LogLevel, KubbPlugin } from './types.ts'

type BuildOutput = {
  files: FileManager['files']
}

// Same type as ora
type Spinner = {
  start: (text?: string) => Spinner
  succeed: (text: string) => Spinner
  fail: (text?: string) => Spinner
  stopAndPersist: (options: { text: string }) => Spinner
  render: () => Spinner
  text: string
  info: (text: string) => Spinner
}

export type Logger = {
  log: (message: string, logLevel: LogLevel) => void
  spinner?: Spinner
}
type BuildOptions = {
  config: PluginContext['config']
  logger?: Logger
}

async function transformReducer(
  this: PluginContext,
  _previousCode: string,
  result: TransformResult | Promise<TransformResult>,
  _plugin: KubbPlugin
): Promise<string | null> {
  if (result === null) {
    return null
  }
  return result
}

async function buildImplementation(options: BuildOptions): Promise<BuildOutput> {
  const { config, logger } = options

  if (config.output.clean) {
    await clean(config.output.path)
  }

  const queueTask = async (id: string, file: File) => {
    const { path } = file

    let code = getFileSource(file)

    const loadedResult = await pluginManager.hookFirst({
      hookName: 'load',
      parameters: [path],
    })
    if (loadedResult) {
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

  const pluginManager = new PluginManager(config, { logger, task: queueTask as QueueTask })
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

  return { files: fileManager.files.map((file) => ({ ...file, source: getFileSource(file) })) }
}

export type KubbBuild = (options: BuildOptions) => Promise<BuildOutput>

export function build(options: BuildOptions): Promise<BuildOutput> {
  return new Promise(async (resolve, reject) => {
    try {
      const output = await buildImplementation(options)

      setTimeout(() => {
        resolve(output)
      }, 500)
    } catch (e) {
      reject(e)
    }
  })
}
