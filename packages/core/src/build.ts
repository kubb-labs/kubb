import { join, relative, resolve } from 'node:path'
import pc from 'picocolors'
import { isDeepEqual } from 'remeda'
import { isInputPath } from './config.ts'
import type { KubbFile } from './fs/index.ts'
import { clean, exists, getRelativePath } from './fs/index.ts'
import type { Logger } from './logger.ts'
import { createLogger } from './logger.ts'
import { PluginManager } from './PluginManager.ts'
import type { Config, Output, UserConfig } from './types.ts'
import { URLPath } from './utils/URLPath.ts'

type BuildOptions = {
  config: UserConfig
  /**
   * @default Logger without the spinner
   */
  logger?: Logger
  pluginManager?: PluginManager
}

type BuildOutput = {
  files: Array<KubbFile.ResolvedFile>
  pluginManager: PluginManager
  /**
   * Only for safeBuild
   */
  error?: Error
}

export async function setup(options: BuildOptions): Promise<PluginManager> {
  if (options.pluginManager) {
    return options.pluginManager
  }

  const { config: userConfig, logger = createLogger() } = options

  if (Array.isArray(userConfig.input)) {
    console.warn(pc.yellow('This feature is still under development — use with caution'))
  }

  try {
    if (isInputPath(userConfig) && !new URLPath(userConfig.input.path).isURL) {
      await exists(userConfig.input.path)
    }
  } catch (e) {
    if (isInputPath(userConfig)) {
      throw new Error(
        `Cannot read file/URL defined in \`input.path\` or set with \`kubb generate PATH\` in the CLI of your Kubb config ${userConfig.input.path}`,
        {
          cause: e,
        },
      )
    }
  }

  const definedConfig: Config = {
    root: userConfig.root || process.cwd(),
    ...userConfig,
    output: {
      write: true,
      barrelType: 'named',
      extension: {
        '.ts': '.ts',
      },
      defaultBanner: 'simple',
      ...userConfig.output,
    },
    plugins: userConfig.plugins as Config['plugins'],
  }

  if (definedConfig.output.clean) {
    await clean(definedConfig.output.path)
    await clean(join(definedConfig.root, '.kubb'))
  }

  return new PluginManager(definedConfig, { logger, concurrency: 5 })
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

  const config = pluginManager.config

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
      parameters: [config],
      message: 'buildStart',
    })

    if (config.output.barrelType) {
      // create root barrel file
      const root = resolve(config.root)
      const rootPath = resolve(root, config.output.path, 'index.ts')

      //TODO find clean method without loading all files
      const files = await pluginManager.fileManager.files

      const barrelFiles = files.filter((file) => {
        return file.sources.some((source) => source.isIndexable)
      })

      const rootFile: KubbFile.File = {
        path: rootPath,
        baseName: 'index.ts',
        exports: barrelFiles
          .flatMap((file) => {
            const containsOnlyTypes = file.sources?.every((source) => source.isTypeOnly)

            return file.sources
              ?.map((source) => {
                if (!file.path || !source.isIndexable) {
                  return undefined
                }

                // validate of the file is coming from plugin x, needs pluginKey on every file TODO update typing
                const plugin = [...pluginManager.plugins].find((item) => {
                  const meta = file.meta as any
                  return isDeepEqual(item.key, meta?.pluginKey)
                })
                const pluginOptions = plugin?.options as { output?: Output<any> }

                if (!pluginOptions || pluginOptions?.output?.barrelType === false) {
                  return undefined
                }

                return {
                  name: config.output.barrelType === 'all' ? undefined : [source.name],
                  path: getRelativePath(rootPath, file.path),
                  isTypeOnly: config.output.barrelType === 'all' ? containsOnlyTypes : source.isTypeOnly,
                } as KubbFile.Export
              })
              .filter(Boolean)
          })
          .filter(Boolean),
        sources: [],
        meta: {},
      }

      await pluginManager.fileManager.add(rootFile)
    }

    pluginManager.fileManager.processor.events.on('process:start', ({ files }) => {
      pluginManager.logger.emit('progress_start', { id: 'files', size: files.length, message: 'Writing files ...' })
    })

    pluginManager.fileManager.processor.events.on('process:progress', ({ file }) => {
      const message = file ? `Writing ${relative(config.root, file.path)}` : ''
      pluginManager.logger.emit('progressed', { id: 'files', message })
    })


    pluginManager.fileManager.processor.events.on('process:end', () => {
      pluginManager.logger.emit('progress_stop', { id: 'files' })
    })

    const files = await pluginManager.fileManager.write({
      extension: config.output.extension,
      dryRun: !config.output.write,
    })

    await pluginManager.hookParallel({ hookName: 'buildEnd', message: `Build stopped for ${config.name}` })

    await pluginManager.fileManager.clear()

    return {
      files,
      pluginManager,
    }
  } catch (e) {
    return {
      files: [],
      pluginManager,
      error: e as Error,
    }
  }
}
