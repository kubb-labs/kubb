/* eslint-disable no-async-promise-executor */
import pathParser from 'path'

import { isURL } from './utils/isURL'
import { PluginManager } from './managers/pluginManager'
import { clean, read } from './utils'

import type { QueueTask } from './utils'
import type { FileManager, File } from './managers/fileManager'
import type { PluginContext, TransformResult, LogLevel, KubbPlugin } from './types'

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

async function transformReducer(this: PluginContext, _previousCode: string, result: TransformResult, _plugin: KubbPlugin) {
  if (result === null) {
    return null
  }
  return result
}

async function buildImplementation(options: BuildOptions, done: (output: BuildOutput) => void) {
  const { config, logger } = options

  if (config.output.clean) {
    await clean(config.output.path)
  }

  const queueTask: QueueTask<void> = async (id: string, file: File) => {
    const { path } = file

    let code = fileManager.getSource(file)

    const loadedResult = await pluginManager.hookFirst('load', [path])
    if (loadedResult) {
      code = loadedResult
    }

    if (code) {
      const transformedCode = await pluginManager.hookReduceArg0('transform', [code, path], transformReducer)

      if (config.output.write || config.output.write === undefined) {
        await pluginManager.hookParallel('writeFile', [transformedCode, path])
      }
    }
  }

  const pluginManager = new PluginManager(config, { logger, task: queueTask })
  const { plugins, fileManager } = pluginManager

  await pluginManager.hookParallel<'validate', true>('validate', [plugins])

  await pluginManager.hookParallel('buildStart', [config])

  await pluginManager.hookParallel('buildEnd')
  setTimeout(() => {
    done({ files: fileManager.files.map((file) => ({ ...file, source: fileManager.getSource(file) })) })
  }, 500)

  pluginManager.fileManager.add({
    path: isURL(config.input.path) ? config.input.path : pathParser.resolve(config.root, config.input.path),
    fileName: isURL(config.input.path) ? 'input' : config.input.path,
    source: isURL(config.input.path) ? config.input.path : await read(pathParser.resolve(config.root, config.input.path)),
  })
}

export type KubbBuild = (options: BuildOptions) => Promise<BuildOutput>

export function build(options: BuildOptions): Promise<BuildOutput> {
  return new Promise(async (resolve, reject) => {
    try {
      await buildImplementation(options, resolve)
    } catch (e) {
      reject(e)
    }
  })
}
