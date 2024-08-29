import { clean, read } from '@kubb/fs'
import type * as KubbFile from '@kubb/fs/types'
import { FileManager, processFiles } from './FileManager.ts'
import { PluginManager } from './PluginManager.ts'
import { isInputPath } from './config.ts'
import { createLogger } from './logger.ts'
import { URLPath } from './utils/URLPath.ts'

import { resolve } from 'node:path'
import { getRelativePath } from '@kubb/fs'
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
              const plugin = pluginManager.plugins.find((item) => {
                const meta = file.meta as any
                return item.name === meta?.pluginKey?.[0]
              })

              if (plugin?.output?.exportType === false) {
                return undefined
              }

              if (FileManager.getMode(plugin?.output?.path) === 'single') {
                return undefined
              }
              return {
                name: options.config.output.exportType === 'barrel' ? undefined : [source.name],
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

    if (options.config.output.exportType) {
      await pluginManager.fileManager.add(rootFile)
    }

    //TODO set extName here instead of the files, extName is private. All exports will have extName, it's up the the process to hide.override the name
    files = await processFiles({
      config: options.config,
      dryRun: !options.config.output.write,
      files: pluginManager.fileManager.files,
      logger: pluginManager.logger,
    })

    await pluginManager.hookParallel({ hookName: 'buildEnd' })

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
