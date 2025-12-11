import { join, relative, resolve } from 'node:path'
import { performance } from 'node:perf_hooks'
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
import type { Config, Output, Plugin, UserConfig } from './types.ts'
import { formatDiagnosticInfo } from './utils/diagnostics.ts'
import { URLPath } from './utils/URLPath.ts'

type BuildOptions = {
  config: UserConfig
  /**
   * @default Logger without the spinner
   */
  logger?: Logger
}

type BuildOutput = {
  failedPlugins: Set<{ plugin: Plugin; error: Error }>
  fabric: Fabric
  files: Array<KubbFile.ResolvedFile>
  pluginManager: PluginManager
  pluginTimings: Map<string, number>
  // TODO check if we can remove error
  /**
   * Only for safeBuild,
   * @deprecated
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

  logger.emit('debug', {
    date: new Date(),
    category: 'setup',
    logs: [
      'Setup',
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      'Configuration:',
      `  • Name: ${userConfig.name || 'unnamed'}`,
      `  • Root: ${userConfig.root || process.cwd()}`,
      `  • Output: ${userConfig.output?.path || 'not specified'}`,
      `  • Plugins: ${userConfig.plugins?.length || 0}`,
      'Output Settings:',
      `  • Write: ${userConfig.output?.write !== false ? 'enabled' : 'disabled'}`,
      `  • Format: ${userConfig.output?.format || 'none'}`,
      `  • Lint: ${userConfig.output?.lint || 'none'}`,
      'Environment:',
      formatDiagnosticInfo(),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    ],
  })

  try {
    if (isInputPath(userConfig) && !new URLPath(userConfig.input.path).isURL) {
      await exists(userConfig.input.path)
      logger.emit('debug', {
        date: new Date(),
        category: 'setup',
        logs: [`✓ Input file validated: ${userConfig.input.path}`],
      })
    }
  } catch (e) {
    if (isInputPath(userConfig)) {
      const error = e as Error
      logger.emit('debug', {
        date: new Date(),
        category: 'setup',
        logs: ['Failed to validate input file', `Path: ${userConfig.input.path}`, `Error: ${error.message}`],
      })
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
    logger.emit('debug', {
      date: new Date(),
      category: 'setup',
      logs: ['Cleaning output directories', `  • Output: ${definedConfig.output.path}`, '  • Cache: .kubb'],
    })
    await clean(definedConfig.output.path)
    await clean(join(definedConfig.root, '.kubb'))
  }

  const fabric = createFabric()
  fabric.use(fsPlugin, { dryRun: !definedConfig.output.write })
  fabric.use(typescriptParser)

  logger.emit('debug', {
    date: new Date(),
    category: 'setup',
    logs: [
      '✓ Fabric initialized',
      `  • File writing: ${definedConfig.output.write ? 'enabled' : 'disabled (dry-run)'}`,
      `  • Barrel type: ${definedConfig.output.barrelType || 'none'}`,
    ],
  })

  const pluginManager = new PluginManager(definedConfig, { fabric, logger, concurrency: 5 })

  logger.emit('debug', {
    date: new Date(),
    category: 'setup',
    logs: ['✓ PluginManager initialized', '  • Concurrency: 5', `  • Total plugins: ${pluginManager.plugins.length}`],
  })

  return {
    fabric,
    pluginManager,
  }
}

export async function build(options: BuildOptions, overrides?: SetupResult): Promise<BuildOutput> {
  const { fabric, files, pluginManager, failedPlugins, pluginTimings, error } = await safeBuild(options, overrides)

  if (error) {
    throw error
  }

  return {
    failedPlugins,
    fabric,
    files,
    pluginManager,
    pluginTimings,
    error,
  }
}

export async function safeBuild(options: BuildOptions, overrides?: SetupResult): Promise<BuildOutput> {
  const { fabric, pluginManager } = overrides ? overrides : await setup(options)

  const failedPlugins = new Set<{ plugin: Plugin; error: Error }>()
  const pluginTimings = new Map<string, number>()
  const config = pluginManager.config

  try {
    // Emit initial progress for all plugins
    pluginManager.logger.emit('progress_start', {
      id: 'plugins',
      size: pluginManager.plugins.length,
      message: 'Installing plugins...',
    })

    for (const plugin of pluginManager.plugins) {
      const context = pluginManager.getContext(plugin)

      const installer = plugin.install.bind(context)

      try {
        const startTime = performance.now()
        const timestamp = new Date()

        // Emit plugin start event for progress tracking
        pluginManager.logger.emit('plugin_start', {
          pluginName: plugin.name,
          pluginKey: plugin.key,
        })

        // Start plugin group
        pluginManager.logger.emit('debug', {
          date: timestamp,
          pluginGroupMarker: 'start',
          pluginName: plugin.name,
          logs: [],
        })

        pluginManager.logger.emit('debug', {
          date: timestamp,
          category: 'plugin',
          pluginName: plugin.name,
          logs: ['Installing plugin...', `  • Plugin Key: ${JSON.stringify(plugin.key)}`],
        })

        await installer(context)

        const duration = Math.round(performance.now() - startTime)
        pluginTimings.set(plugin.name, duration)

        // Emit plugin end event for progress tracking
        pluginManager.logger.emit('plugin_end', {
          pluginName: plugin.name,
          pluginKey: plugin.key,
          duration,
        })

        // Update overall plugin progress
        pluginManager.logger.emit('progressed', {
          id: 'plugins',
          message: `Installed ${plugin.name}`,
        })

        pluginManager.logger.emit('debug', {
          date: new Date(),
          category: 'plugin',
          pluginName: plugin.name,
          logs: [`✓ Plugin installed successfully (${duration}ms)`],
        })

        // End plugin group
        pluginManager.logger.emit('debug', {
          date: new Date(),
          pluginGroupMarker: 'end',
          pluginName: plugin.name,
          logs: [],
        })
      } catch (e) {
        const error = e as Error
        const errorTimestamp = new Date()

        pluginManager.logger.emit('debug', {
          date: errorTimestamp,
          category: 'error',
          pluginName: plugin.name,
          logs: [
            '✗ Plugin installation failed',
            `  Plugin Key: ${JSON.stringify(plugin.key)}`,
            `Error: ${error.constructor.name}`,
            `  ${error.message}`,
            'Stack Trace:',
            error.stack || 'No stack trace available',
          ],
        })

        // Update progress even on error
        pluginManager.logger.emit('progressed', {
          id: 'plugins',
          message: `Failed: ${plugin.name}`,
        })

        // End plugin group even on error
        pluginManager.logger.emit('debug', {
          date: errorTimestamp,
          pluginGroupMarker: 'end',
          pluginName: plugin.name,
          logs: [],
        })

        failedPlugins.add({ plugin, error })
      }
    }

    // Stop plugin progress
    pluginManager.logger.emit('progress_stop', { id: 'plugins' })

    if (config.output.barrelType) {
      const root = resolve(config.root)
      const rootPath = resolve(root, config.output.path, 'index.ts')

      pluginManager.logger.emit('debug', {
        date: new Date(),
        logs: ['Generating barrel file', `Type: ${config.output.barrelType}`, `Path: ${rootPath}`],
      })

      const barrelFiles = fabric.files.filter((file) => {
        return file.sources.some((source) => source.isIndexable)
      })

      pluginManager.logger.emit('debug', {
        date: new Date(),
        logs: [`Found ${barrelFiles.length} indexable files for barrel export`],
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

      await fabric.upsertFile(rootFile)

      pluginManager.logger.emit('debug', {
        date: new Date(),
        category: 'file',
        logs: [`✓ Generated barrel file (${rootFile.exports?.length || 0} exports)`],
      })
    }

    fabric.context.on('process:start', ({ files }) => {
      pluginManager.logger.emit('progress_start', { id: 'files', size: files.length, message: 'Writing files ...' })
      pluginManager.logger.emit('debug', {
        date: new Date(),
        category: 'file',
        logs: [`Writing ${files.length} files...`],
      })
    })

    fabric.context.on('process:progress', async ({ file, source }) => {
      const message = file ? `Writing ${relative(config.root, file.path)}` : ''
      pluginManager.logger.emit('progressed', { id: 'files', message })

      // Removed verbose file write logs - progress bar already shows this

      if (source) {
        await write(file.path, source, { sanity: false })
      }
    })

    fabric.context.on('process:end', () => {
      pluginManager.logger.emit('progress_stop', { id: 'files' })
      pluginManager.logger.emit('debug', {
        date: new Date(),
        category: 'file',
        logs: ['✓ File write process completed'],
      })
    })
    const files = [...fabric.files]

    await fabric.write({ extension: config.output.extension })

    return {
      failedPlugins,
      fabric,
      files,
      pluginManager,
      pluginTimings,
    }
  } catch (e) {
    return {
      failedPlugins,
      fabric,
      files: [],
      pluginManager,
      pluginTimings,
      error: e as Error,
    }
  }
}
