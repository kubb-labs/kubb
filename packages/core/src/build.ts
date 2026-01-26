import { resolve } from 'node:path'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Fabric } from '@kubb/react-fabric'
import { createFabric } from '@kubb/react-fabric'
import { typescriptParser } from '@kubb/react-fabric/parsers'
import { fsPlugin } from '@kubb/react-fabric/plugins'
import { isInputPath } from './config.ts'
import { BuildError } from './errors.ts'
import { clean, exists, getRelativePath, write } from './fs/index.ts'
import { PluginManager } from './PluginManager.ts'
import type { Config, KubbEvents, Output, Plugin, UserConfig } from './types.ts'
import { AsyncEventEmitter } from './utils/AsyncEventEmitter.ts'
import { getDiagnosticInfo } from './utils/diagnostics.ts'
import { formatMs, getElapsedMs } from './utils/formatHrtime.ts'
import { URLPath } from './utils/URLPath.ts'

type BuildOptions = {
  config: UserConfig
  events?: AsyncEventEmitter<KubbEvents>
}

type BuildOutput = {
  failedPlugins: Set<{ plugin: Plugin; error: Error }>
  fabric: Fabric
  files: Array<KubbFile.ResolvedFile>
  pluginManager: PluginManager
  pluginTimings: Map<string, number>
  error?: Error
}

type SetupResult = {
  events: AsyncEventEmitter<KubbEvents>
  fabric: Fabric
  pluginManager: PluginManager
}

export async function setup(options: BuildOptions): Promise<SetupResult> {
  const { config: userConfig, events = new AsyncEventEmitter<KubbEvents>() } = options

  const diagnosticInfo = getDiagnosticInfo()

  if (Array.isArray(userConfig.input)) {
    await events.emit('warn', 'This feature is still under development — use with caution')
  }

  await events.emit('debug', {
    date: new Date(),
    logs: [
      'Configuration:',
      `  • Name: ${userConfig.name || 'unnamed'}`,
      `  • Root: ${userConfig.root || process.cwd()}`,
      `  • Output: ${userConfig.output?.path || 'not specified'}`,
      `  • Plugins: ${userConfig.plugins?.length || 0}`,
      'Output Settings:',
      `  • Write: ${userConfig.output?.write !== false ? 'enabled' : 'disabled'}`,
      `  • Formatter: ${userConfig.output?.format || 'none'}`,
      `  • Linter: ${userConfig.output?.lint || 'none'}`,
      'Environment:',
      Object.entries(diagnosticInfo)
        .map(([key, value]) => `  • ${key}: ${value}`)
        .join('\n'),
    ],
  })

  try {
    if (isInputPath(userConfig) && !new URLPath(userConfig.input.path).isURL) {
      await exists(userConfig.input.path)

      await events.emit('debug', {
        date: new Date(),
        logs: [`✓ Input file validated: ${userConfig.input.path}`],
      })
    }
  } catch (caughtError) {
    if (isInputPath(userConfig)) {
      const error = caughtError as Error

      throw new Error(
        `Cannot read file/URL defined in \`input.path\` or set with \`kubb generate PATH\` in the CLI of your Kubb config ${userConfig.input.path}`,
        {
          cause: error,
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
    await events.emit('debug', {
      date: new Date(),
      logs: ['Cleaning output directories', `  • Output: ${definedConfig.output.path}`],
    })
    await clean(definedConfig.output.path)
  }

  const fabric = createFabric()
  fabric.use(fsPlugin, { dryRun: !definedConfig.output.write })
  fabric.use(typescriptParser)

  fabric.context.on('files:processing:start', (files) => {
    events.emit('files:processing:start', files)
    events.emit('debug', {
      date: new Date(),
      logs: [`Writing ${files.length} files...`],
    })
  })

  fabric.context.on('file:processing:update', async (params) => {
    const { file, source } = params
    await events.emit('file:processing:update', {
      ...params,
      config: definedConfig,
      source,
    })

    if (source) {
      await write(file.path, source, { sanity: false })
    }
  })

  fabric.context.on('files:processing:end', async (files) => {
    await events.emit('files:processing:end', files)
    await events.emit('debug', {
      date: new Date(),
      logs: [`✓ File write process completed for ${files.length} files`],
    })
  })

  await events.emit('debug', {
    date: new Date(),
    logs: [
      '✓ Fabric initialized',
      `  • File writing: ${definedConfig.output.write ? 'enabled' : 'disabled (dry-run)'}`,
      `  • Barrel type: ${definedConfig.output.barrelType || 'none'}`,
    ],
  })

  const pluginManager = new PluginManager(definedConfig, {
    fabric,
    events,
    concurrency: 15, // Increased from 5 to 15 for better parallel plugin execution
  })

  return {
    events,
    fabric,
    pluginManager,
  }
}

export async function build(options: BuildOptions, overrides?: SetupResult): Promise<BuildOutput> {
  const { fabric, files, pluginManager, failedPlugins, pluginTimings, error } = await safeBuild(options, overrides)

  if (error) {
    throw error
  }

  if (failedPlugins.size > 0) {
    const errors = [...failedPlugins].map(({ error }) => error)

    throw new BuildError(`Build Error with ${failedPlugins.size} failed plugins`, { errors })
  }

  return {
    failedPlugins,
    fabric,
    files,
    pluginManager,
    pluginTimings,
    error: undefined,
  }
}

export async function safeBuild(options: BuildOptions, overrides?: SetupResult): Promise<BuildOutput> {
  const { fabric, pluginManager, events } = overrides ? overrides : await setup(options)

  const failedPlugins = new Set<{ plugin: Plugin; error: Error }>()
  // in ms
  const pluginTimings = new Map<string, number>()
  const config = pluginManager.config

  try {
    for (const plugin of pluginManager.plugins) {
      const context = pluginManager.getContext(plugin)
      const hrStart = process.hrtime()

      const installer = plugin.install.bind(context)

      try {
        const timestamp = new Date()

        await events.emit('plugin:start', plugin)

        await events.emit('debug', {
          date: timestamp,
          logs: ['Installing plugin...', `  • Plugin Key: [${plugin.key.join(', ')}]`],
        })

        await installer(context)

        const duration = getElapsedMs(hrStart)
        pluginTimings.set(plugin.name, duration)

        await events.emit('plugin:end', plugin, { duration, success: true })

        await events.emit('debug', {
          date: new Date(),
          logs: [`✓ Plugin installed successfully (${formatMs(duration)})`],
        })
      } catch (caughtError) {
        const error = caughtError as Error
        const errorTimestamp = new Date()
        const duration = getElapsedMs(hrStart)

        await events.emit('plugin:end', plugin, {
          duration,
          success: false,
          error,
        })

        await events.emit('debug', {
          date: errorTimestamp,
          logs: [
            '✗ Plugin installation failed',
            `  • Plugin Key: ${JSON.stringify(plugin.key)}`,
            `  • Error: ${error.constructor.name} - ${error.message}`,
            '  • Stack Trace:',
            error.stack || 'No stack trace available',
          ],
        })

        failedPlugins.add({ plugin, error })
      }
    }

    if (config.output.barrelType) {
      const root = resolve(config.root)
      const rootPath = resolve(root, config.output.path, 'index.ts')

      await events.emit('debug', {
        date: new Date(),
        logs: ['Generating barrel file', `  • Type: ${config.output.barrelType}`, `  • Path: ${rootPath}`],
      })

      const barrelFiles = fabric.files.filter((file) => {
        return file.sources.some((source) => source.isIndexable)
      })

      await events.emit('debug', {
        date: new Date(),
        logs: [`Found ${barrelFiles.length} indexable files for barrel export`],
      })

      // Build a Map of plugin keys to plugins for efficient lookups
      const pluginKeyMap = new Map<string, Plugin>()
      for (const plugin of pluginManager.plugins) {
        pluginKeyMap.set(JSON.stringify(plugin.key), plugin)
      }

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
                const meta = file.meta as any
                const plugin = meta?.pluginKey ? pluginKeyMap.get(JSON.stringify(meta.pluginKey)) : undefined
                const pluginOptions = plugin?.options as {
                  output?: Output<any>
                }

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
        imports: [],
        meta: {},
      }

      await fabric.upsertFile(rootFile)

      await events.emit('debug', {
        date: new Date(),
        logs: [`✓ Generated barrel file (${rootFile.exports?.length || 0} exports)`],
      })
    }

    const files = [...fabric.files]

    await fabric.write({ extension: config.output.extension })

    return {
      failedPlugins,
      fabric,
      files,
      pluginManager,
      pluginTimings,
    }
  } catch (error) {
    return {
      failedPlugins,
      fabric,
      files: [],
      pluginManager,
      pluginTimings,
      error: error as Error,
    }
  }
}
