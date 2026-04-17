import { dirname, resolve } from 'node:path'
import { AsyncEventEmitter, BuildError, exists, formatMs, getElapsedMs, getRelativePath, URLPath } from '@internals/utils'
import type { ExportNode, FileNode, OperationNode } from '@kubb/ast'
import { createExport, createFile, transform, walk } from '@kubb/ast'
import { BARREL_FILENAME, DEFAULT_BANNER, DEFAULT_CONCURRENCY, DEFAULT_EXTENSION, DEFAULT_STUDIO_URL } from './constants.ts'
import type { RendererFactory } from './createRenderer.ts'
import type { Generator } from './defineGenerator.ts'
import type { Parser } from './defineParser.ts'
import { FileProcessor } from './FileProcessor.ts'
import type { Kubb } from './Kubb.ts'
import { PluginDriver } from './PluginDriver.ts'
import { applyHookResult } from './renderNode.ts'
import { fsStorage } from './storages/fsStorage.ts'
import type { AdapterSource, Config, GeneratorContext, KubbHooks, Plugin, PluginContext, Storage } from './types.ts'
import { getDiagnosticInfo } from './utils/diagnostics.ts'
import type { FileMetaBase } from './utils/getBarrelFiles.ts'
import { getBarrelFiles } from './utils/getBarrelFiles.ts'
import { isInputPath } from './utils/isInputPath.ts'

type BuildOptions = {
  config: Config
  hooks?: AsyncEventEmitter<KubbHooks>
}

/**
 * Full output produced by a successful or failed build.
 */
export type BuildOutput = {
  /**
   * Plugins that threw during installation, paired with the caught error.
   */
  failedPlugins: Set<{ plugin: Plugin; error: Error }>
  files: Array<FileNode>
  driver: PluginDriver
  /**
   * Elapsed time in milliseconds for each plugin, keyed by plugin name.
   */
  pluginTimings: Map<string, number>
  error?: Error
  /**
   * Raw generated source, keyed by absolute file path.
   */
  sources: Map<string, string>
}

type SetupResult = {
  hooks: AsyncEventEmitter<KubbHooks>
  driver: PluginDriver
  sources: Map<string, string>
  config: Config
  storage: Storage | null
}

async function setup(options: BuildOptions): Promise<SetupResult> {
  const { config: userConfig } = options
  const hooks = options.hooks ?? new AsyncEventEmitter<KubbHooks>()

  const sources: Map<string, string> = new Map<string, string>()
  const diagnosticInfo = getDiagnosticInfo()

  if (Array.isArray(userConfig.input)) {
    await hooks.emit('kubb:warn', 'This feature is still under development — use with caution')
  }

  await hooks.emit('kubb:debug', {
    date: new Date(),
    logs: [
      'Configuration:',
      `  • Name: ${userConfig.name || 'unnamed'}`,
      `  • Root: ${userConfig.root || process.cwd()}`,
      `  • Output: ${userConfig.output?.path || 'not specified'}`,
      `  • Plugins: ${userConfig.plugins?.length || 0}`,
      'Output Settings:',
      `  • Storage: ${userConfig.output?.storage ? `custom(${userConfig.output.storage.name})` : userConfig.output?.write === false ? 'disabled' : 'filesystem (default)'}`,
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

      await hooks.emit('kubb:debug', {
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

  if (!userConfig.adapter) {
    throw new Error('Adapter should be defined')
  }

  const config: Config = {
    ...userConfig,
    root: userConfig.root || process.cwd(),
    parsers: userConfig.parsers ?? [],
    adapter: userConfig.adapter,
    output: {
      write: true,
      barrelType: 'named',
      extension: DEFAULT_EXTENSION,
      defaultBanner: DEFAULT_BANNER,
      ...userConfig.output,
    },
    devtools: userConfig.devtools
      ? {
          studioUrl: DEFAULT_STUDIO_URL,
          ...(typeof userConfig.devtools === 'boolean' ? {} : userConfig.devtools),
        }
      : undefined,
    plugins: userConfig.plugins as unknown as Config['plugins'],
  }

  const storage: Storage | null = config.output.write === false ? null : (config.output.storage ?? fsStorage())

  if (config.output.clean) {
    await hooks.emit('kubb:debug', {
      date: new Date(),
      logs: ['Cleaning output directories', `  • Output: ${config.output.path}`],
    })
    await storage?.clear(resolve(config.root, config.output.path))
  }

  const driver = new PluginDriver(config, {
    hooks,
    concurrency: DEFAULT_CONCURRENCY,
  })

  const adapter = config.adapter
  if (!adapter) {
    throw new Error('No adapter configured. Please provide an adapter in your kubb.config.ts.')
  }
  const source = inputToAdapterSource(config)

  await hooks.emit('kubb:debug', {
    date: new Date(),
    logs: [`Running adapter: ${adapter.name}`],
  })

  driver.adapter = adapter
  driver.inputNode = await adapter.parse(source)

  await hooks.emit('kubb:debug', {
    date: new Date(),
    logs: [
      `✓ Adapter '${adapter.name}' resolved InputNode`,
      `  • Schemas: ${driver.inputNode.schemas.length}`,
      `  • Operations: ${driver.inputNode.operations.length}`,
    ],
  })

  return {
    config,
    hooks,
    driver,
    sources,
    storage,
  }
}

/**
 * Walks the AST and dispatches nodes to a plugin's direct AST hooks
 * (`schema`, `operation`, `operations`).
 */
async function runPluginAstHooks(plugin: Plugin, context: PluginContext): Promise<void> {
  const { adapter, inputNode, resolver, driver } = context
  const { exclude, include, override } = plugin.options

  if (!adapter || !inputNode) {
    throw new Error(`[${plugin.name}] No adapter found. Add an OAS adapter (e.g. pluginOas()) before this plugin in your Kubb config.`)
  }

  function resolveRenderer(gen: Generator): RendererFactory | undefined {
    return gen.renderer === null ? undefined : (gen.renderer ?? plugin.renderer ?? context.config.renderer)
  }

  const generators = plugin.generators ?? []
  const collectedOperations: Array<OperationNode> = []

  const baseGeneratorContext = context as GeneratorContext
  const generatorContext = {
    ...baseGeneratorContext,
    resolver: driver.getResolver(plugin.name),
  }

  await walk(inputNode, {
    depth: 'shallow',
    async schema(node) {
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node
      const options = resolver.resolveOptions(transformedNode, { options: plugin.options, exclude, include, override })
      if (options === null) return

      const ctx = { ...generatorContext, options }

      for (const gen of generators) {
        if (!gen.schema) continue
        const result = await gen.schema(transformedNode, ctx)
        await applyHookResult(result, driver, resolveRenderer(gen))
      }

      await driver.hooks.emit('kubb:generate:schema', transformedNode, ctx)
    },
    async operation(node) {
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node
      const options = resolver.resolveOptions(transformedNode, { options: plugin.options, exclude, include, override })
      if (options !== null) {
        collectedOperations.push(transformedNode)

        const ctx = { ...generatorContext, options }

        for (const gen of generators) {
          if (!gen.operation) continue
          const result = await gen.operation(transformedNode, ctx)
          await applyHookResult(result, driver, resolveRenderer(gen))
        }

        await driver.hooks.emit('kubb:generate:operation', transformedNode, ctx)
      }
    },
  })

  if (collectedOperations.length > 0) {
    const ctx = { ...generatorContext, options: plugin.options }

    for (const gen of generators) {
      if (!gen.operations) continue
      const result = await gen.operations(collectedOperations, ctx)
      await applyHookResult(result, driver, resolveRenderer(gen))
    }

    await driver.hooks.emit('kubb:generate:operations', collectedOperations, ctx)
  }
}

async function safeBuild(setupResult: SetupResult): Promise<BuildOutput> {
  const { driver, hooks, sources, storage } = setupResult

  const failedPlugins = new Set<{ plugin: Plugin; error: Error }>()
  const pluginTimings = new Map<string, number>()
  const config = driver.config

  try {
    await driver.emitSetupHooks()

    if (driver.adapter && driver.inputNode) {
      await hooks.emit('kubb:build:start', {
        config,
        adapter: driver.adapter,
        inputNode: driver.inputNode,
        getPlugin: (name) => driver.getPlugin(name),
      })
    }

    for (const plugin of driver.plugins.values()) {
      const context = driver.getContext(plugin)
      const hrStart = process.hrtime()
      const { output } = plugin.options ?? {}
      const root = resolve(config.root, config.output.path)

      try {
        const timestamp = new Date()

        await hooks.emit('kubb:plugin:start', plugin)

        await hooks.emit('kubb:debug', {
          date: timestamp,
          logs: ['Starting plugin...', `  • Plugin Name: ${plugin.name}`],
        })

        await plugin.buildStart.call(context)

        if (plugin.generators?.length || driver.hasRegisteredGenerators(plugin.name)) {
          await runPluginAstHooks(plugin, context)
        }

        if (output) {
          const barrelFiles = await getBarrelFiles(driver.fileManager.files, {
            type: output.barrelType ?? 'named',
            root,
            output,
            meta: { pluginName: plugin.name },
          })
          await context.upsertFile(...barrelFiles)
        }

        const duration = getElapsedMs(hrStart)
        pluginTimings.set(plugin.name, duration)

        await hooks.emit('kubb:plugin:end', plugin, { duration, success: true })

        await hooks.emit('kubb:debug', {
          date: new Date(),
          logs: [`✓ Plugin started successfully (${formatMs(duration)})`],
        })
      } catch (caughtError) {
        const error = caughtError as Error
        const errorTimestamp = new Date()
        const duration = getElapsedMs(hrStart)

        await hooks.emit('kubb:plugin:end', plugin, {
          duration,
          success: false,
          error,
        })

        await hooks.emit('kubb:debug', {
          date: errorTimestamp,
          logs: [
            '✗ Plugin start failed',
            `  • Plugin Name: ${plugin.name}`,
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
      const rootPath = resolve(root, config.output.path, BARREL_FILENAME)
      const rootDir = dirname(rootPath)

      await hooks.emit('kubb:debug', {
        date: new Date(),
        logs: ['Generating barrel file', `  • Type: ${config.output.barrelType}`, `  • Path: ${rootPath}`],
      })

      const barrelFiles = driver.fileManager.files.filter((file) => {
        return file.sources.some((source) => source.isIndexable)
      })

      await hooks.emit('kubb:debug', {
        date: new Date(),
        logs: [`Found ${barrelFiles.length} indexable files for barrel export`],
      })

      const existingBarrel = driver.fileManager.files.find((f) => f.path === rootPath)
      const existingExports = new Set(
        existingBarrel?.exports?.flatMap((e) => (Array.isArray(e.name) ? e.name : [e.name])).filter((n): n is string => Boolean(n)) ?? [],
      )

      const rootFile = createFile<object>({
        path: rootPath,
        baseName: BARREL_FILENAME,
        exports: buildBarrelExports({ barrelFiles, rootDir, existingExports, config, driver }).map((e) => createExport(e)),
        sources: [],
        imports: [],
        meta: {},
      })

      driver.fileManager.upsert(rootFile)

      await hooks.emit('kubb:debug', {
        date: new Date(),
        logs: [`✓ Generated barrel file (${rootFile.exports?.length || 0} exports)`],
      })
    }

    const files = driver.fileManager.files

    const parsersMap = new Map<FileNode['extname'], Parser>()
    for (const parser of config.parsers) {
      if (parser.extNames) {
        for (const extname of parser.extNames) {
          parsersMap.set(extname, parser)
        }
      }
    }

    const fileProcessor = new FileProcessor()

    await hooks.emit('kubb:debug', {
      date: new Date(),
      logs: [`Writing ${files.length} files...`],
    })

    await fileProcessor.run(files, {
      parsers: parsersMap,
      extension: config.output.extension,
      onStart: async (processingFiles) => {
        await hooks.emit('kubb:files:processing:start', processingFiles)
      },
      onUpdate: async ({ file, source, processed, total, percentage }) => {
        await hooks.emit('kubb:file:processing:update', {
          file,
          source,
          processed,
          total,
          percentage,
          config,
        })
        if (source) {
          await storage?.setItem(file.path, source)
          sources.set(file.path, source)
        }
      },
      onEnd: async (processedFiles) => {
        await hooks.emit('kubb:files:processing:end', processedFiles)
        await hooks.emit('kubb:debug', {
          date: new Date(),
          logs: [`✓ File write process completed for ${processedFiles.length} files`],
        })
      },
    })

    for (const plugin of driver.plugins.values()) {
      if (plugin.buildEnd) {
        const context = driver.getContext(plugin)
        await plugin.buildEnd.call(context)
      }
    }

    await hooks.emit('kubb:build:end', {
      files,
      config,
      outputDir: resolve(config.root, config.output.path),
    })

    return {
      failedPlugins,
      files,
      driver,
      pluginTimings,
      sources,
    }
  } catch (error) {
    return {
      failedPlugins,
      files: [],
      driver,
      pluginTimings,
      error: error as Error,
      sources,
    }
  } finally {
    driver.dispose()
  }
}

async function build(setupResult: SetupResult): Promise<BuildOutput> {
  const { files, driver, failedPlugins, pluginTimings, error, sources } = await safeBuild(setupResult)

  if (error) {
    throw error
  }

  if (failedPlugins.size > 0) {
    const errors = [...failedPlugins].map(({ error }) => error)

    throw new BuildError(`Build Error with ${failedPlugins.size} failed plugins`, { errors })
  }

  return {
    failedPlugins,
    files,
    driver,
    pluginTimings,
    error: undefined,
    sources,
  }
}

type BuildBarrelExportsParams = {
  barrelFiles: FileNode[]
  rootDir: string
  existingExports: Set<string>
  config: Config
  driver: PluginDriver
}

function buildBarrelExports({ barrelFiles, rootDir, existingExports, config, driver }: BuildBarrelExportsParams): ExportNode[] {
  const pluginNameMap = new Map<string, Plugin>()
  for (const plugin of driver.plugins.values()) {
    pluginNameMap.set(plugin.name, plugin)
  }

  return barrelFiles.flatMap((file) => {
    const containsOnlyTypes = file.sources?.every((source) => source.isTypeOnly)

    return (file.sources ?? []).flatMap((source) => {
      if (!file.path || !source.isIndexable) {
        return []
      }

      const meta = file.meta as FileMetaBase | undefined
      const plugin = meta?.pluginName ? pluginNameMap.get(meta.pluginName) : undefined
      const pluginOptions = plugin?.options

      if (!pluginOptions || pluginOptions.output?.barrelType === false) {
        return []
      }

      const exportName = config.output.barrelType === 'all' ? undefined : source.name ? [source.name] : undefined
      if (exportName?.some((n) => existingExports.has(n))) {
        return []
      }

      return [
        createExport({
          name: exportName,
          path: getRelativePath(rootDir, file.path),
          isTypeOnly: config.output.barrelType === 'all' ? containsOnlyTypes : source.isTypeOnly,
        }),
      ]
    })
  })
}

function inputToAdapterSource(config: Config): AdapterSource {
  if (Array.isArray(config.input)) {
    return {
      type: 'paths',
      paths: config.input.map((i) => (new URLPath(i.path).isURL ? i.path : resolve(config.root, i.path))),
    }
  }

  if ('data' in config.input) {
    return { type: 'data', data: config.input.data }
  }

  if (new URLPath(config.input.path).isURL) {
    return { type: 'path', path: config.input.path }
  }

  const resolved = resolve(config.root, config.input.path)
  return { type: 'path', path: resolved }
}

type KubbOptions = {
  config: Config
  hooks?: AsyncEventEmitter<KubbHooks>
}

/**
 * Creates a Kubb instance bound to a single config entry.
 *
 * The instance holds shared state (`hooks`, `sources`, `driver`, `config`) across the
 * `setup → build` lifecycle. Attach event listeners to `kubb.hooks` before
 * calling `setup()` or `build()`.
 *
 * @example
 * ```ts
 * const kubb = createKubb({ config })
 *
 * kubb.hooks.on('kubb:plugin:end', (plugin, { duration }) => {
 *   console.log(`${plugin.name} completed in ${duration}ms`)
 * })
 *
 * const { files, failedPlugins } = await kubb.safeBuild()
 * ```
 */
export function createKubb(options: KubbOptions): Kubb {
  const hooks = options.hooks ?? new AsyncEventEmitter<KubbHooks>()
  let setupResult: SetupResult | undefined

  const instance: Kubb = {
    get hooks() {
      return hooks
    },
    get sources() {
      return setupResult?.sources ?? new Map()
    },
    get driver() {
      return setupResult?.driver
    },
    get config() {
      return setupResult?.config
    },
    async setup() {
      setupResult = await setup({ config: options.config, hooks })
    },
    async build() {
      if (!setupResult) {
        await instance.setup()
      }
      return build(setupResult!)
    },
    async safeBuild() {
      if (!setupResult) {
        await instance.setup()
      }
      return safeBuild(setupResult!)
    },
  }

  return instance
}
