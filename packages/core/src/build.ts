/* eslint-disable no-async-promise-executor */
import pathParser from 'path'

import { PluginManager } from './managers/pluginManager'
import { clean, read } from './utils'

import type { FileManager } from './managers/fileManager'
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
  mode: 'development' | 'production'
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

  const pluginManager = new PluginManager(config, { logger })
  const { plugins, fileManager } = pluginManager

  await pluginManager.hookParallel<'validate', true>('validate', [plugins])

  fileManager.events.onSuccess(async () => {
    await pluginManager.hookParallel('buildEnd')
    setTimeout(() => {
      done({ files: fileManager.files })
    }, 1000)
  })

  fileManager.events.onAdd(async (id, file) => {
    const { path } = file
    let { source: code } = file

    const loadedResult = await pluginManager.hookFirst('load', [path])
    if (loadedResult) {
      code = loadedResult
    }

    if (code) {
      const transformedCode = await pluginManager.hookReduceArg0('transform', [code, path], transformReducer)

      if (typeof config.input === 'object') {
        await pluginManager.hookParallel('writeFile', [transformedCode, path])
      }

      fileManager.setStatus(id, 'success')
      fileManager.remove(id)
    }
  })

  await pluginManager.hookParallel('buildStart', [config])

  pluginManager.fileManager.add({
    path: typeof config.input === 'string' ? 'input' : pathParser.resolve(config.root, config.input.path),
    fileName: typeof config.input === 'string' ? 'input' : config.input.path,
    source: typeof config.input === 'string' ? config.input : await read(pathParser.resolve(config.root, config.input.path)),
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
