import { join, relative, resolve } from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Fabric } from '@kubb/react-fabric'
import { createFabric } from '@kubb/react-fabric'
import { typescriptParser } from '@kubb/react-fabric/parsers'
import { fsPlugin } from '@kubb/react-fabric/plugins'
import pc from 'picocolors'
import { isDeepEqual } from 'remeda'
import { isInputPath } from './config.ts'
import { clean, exists, getRelativePath, write } from './fs/index.ts'
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
}

type BuildOutput = {
  fabric: Fabric
  files: Array<KubbFile.ResolvedFile>
  pluginManager: PluginManager
  /**
   * Only for safeBuild
   */
  error?: Error
}

type SetupResult = {
  fabric: Fabric
  pluginManager: PluginManager
}

export async function setup(options: BuildOptions): Promise<SetupResult> {
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

  const fabric = createFabric()
  fabric.use(fsPlugin, { dryRun: !definedConfig.output.write })
  fabric.use(typescriptParser)

  const pluginManager = new PluginManager(definedConfig, { fabric, logger, concurrency: 5 })

  return {
    fabric,
    pluginManager,
  }
}

export async function build(options: BuildOptions, overrides?: SetupResult): Promise<BuildOutput> {
  const { fabric, files, pluginManager, error } = await safeBuild(options, overrides)

  if (error) {
    throw error
  }

  return {
    fabric,
    files,
    pluginManager,
    error,
  }
}

export async function safeBuild(options: BuildOptions, overrides?: SetupResult): Promise<BuildOutput> {
  const { fabric, pluginManager } = overrides ? overrides : await setup(options)

  const config = pluginManager.config

  try {
    await pluginManager.hookParallel({
      hookName: 'buildStart',
      parameters: [config],
      message: 'buildStart',
    })

    if (config.output.barrelType) {
      const root = resolve(config.root)
      const rootPath = resolve(root, config.output.path, 'index.ts')

      const barrelFiles = fabric.files.filter((file) => {
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

      await fabric.addFile(rootFile)
    }

    fabric.context.on('process:start', ({ files }) => {
      pluginManager.logger.emit('progress_start', { id: 'files', size: files.length, message: 'Writing files ...' })
    })

    fabric.context.on('process:progress', async ({ file, source }) => {
      const message = file ? `Writing ${relative(config.root, file.path)}` : ''
      pluginManager.logger.emit('progressed', { id: 'files', message })

      if (source) {
        await write(file.path, source, { sanity: false })
      }
    })

    fabric.context.on('process:end', () => {
      pluginManager.logger.emit('progress_stop', { id: 'files' })
    })
    const files = [...fabric.files]

    await fabric.write({ extension: config.output.extension })

    return {
      fabric,
      files,
      pluginManager,
    }
  } catch (e) {
    return {
      fabric,
      files: [],
      pluginManager,
      error: e as Error,
    }
  }
}
