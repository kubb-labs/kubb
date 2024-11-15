import { clean, read } from '@kubb/fs'
import type * as KubbFile from '@kubb/fs/types'
import { FileManager, processFiles } from './FileManager.ts'
import { PluginManager } from './PluginManager.ts'
import { isInputPath } from './config.ts'
import { createLogger } from './logger.ts'
import { URLPath } from './utils/URLPath.ts'

import { join, resolve } from 'node:path'
import { getRelativePath } from '@kubb/fs'
import type { Logger } from './logger.ts'
import type { Output, PluginContext } from './types.ts'

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
    await clean(join(config.root, '.kubb'))
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
  let files = []
  const pluginManager = await setup(options)

  try {
    pluginManager.events.on('executing', ({ plugin, message }) => {
      pluginManager.logger.emit('debug', { date: new Date(), logs: [`Executing pluginKey ${plugin.key?.join('.')} | ${message}`] })
    })

    pluginManager.events.on('executed', ({ plugin, message, output }) => {
      pluginManager.logger.emit('debug', {
        date: new Date(),
        logs: [`Executed pluginKey ${plugin.key?.join('.')} | ${message} |  ${JSON.stringify(output, undefined, 2)}`],
      })
    })

    await pluginManager.hookParallel({
      hookName: 'buildStart',
      parameters: [options.config],
      message: 'buildStart',
    })

    // create root barrel file
    const root = resolve(options.config.root)
    const rootPath = resolve(root, options.config.output.path, 'index.ts')
    const barrelFiles = pluginManager.fileManager.files.filter((file) => {
      return file.sources.some((source) => source.isIndexable)
    })

    const rootFile: KubbFile.File = {
      path: rootPath,
      baseName: 'index.ts',
      exports: barrelFiles
        .flatMap((file) => {
          return file.sources
            ?.map((source) => {
              if (!file.path || !source.isIndexable) {
                return undefined
              }

              // validate of the file is coming from plugin x, needs pluginKey on every file TODO update typing
              const plugin = [...pluginManager.plugins].find((item) => {
                const meta = file.meta as any
                return item.key === meta?.pluginKey
              })
              const pluginOptions = (plugin?.options as { output?: Output }) ?? {}

              if (FileManager.getMode(pluginOptions.output?.path) === 'single') {
                return undefined
              }
              return {
                name: pluginOptions.output?.barrelType === 'all' ? undefined : [source.name],
                path: getRelativePath(rootPath, file.path),
                isTypeOnly: source.isTypeOnly,
              } as KubbFile.Export
            })
            .filter(Boolean)
        })
        .filter(Boolean),
      sources: [],
      meta: {},
    }

    if (options.config.output.barrelType) {
      await pluginManager.fileManager.add(rootFile)
    }

    files = await processFiles({
      root: options.config.root,
      extension: options.config.output.extension,
      dryRun: !options.config.output.write,
      files: pluginManager.fileManager.files,
      logger: pluginManager.logger,
    })

    await pluginManager.hookParallel({ hookName: 'buildEnd', message: `Build stopped for ${options.config.name}` })

    pluginManager.fileManager.clear()
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
