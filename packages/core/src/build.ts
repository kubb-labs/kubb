import { dirname, relative, resolve } from 'node:path'
import { AsyncEventEmitter, BuildError, exists, formatMs, getElapsedMs, getRelativePath, URLPath } from '@internals/utils'
import { createExport, createFile, transform, walk } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Fabric as FabricType } from '@kubb/fabric-core/types'
import { createFabric } from '@kubb/react-fabric'
import { fsPlugin } from '@kubb/react-fabric/plugins'
import { BARREL_FILENAME, DEFAULT_BANNER, DEFAULT_CONCURRENCY, DEFAULT_EXTENSION, DEFAULT_STUDIO_URL } from './constants.ts'
import { defineParser } from './defineParser.ts'
import type * as KubbFile from './KubbFile.ts'
import { PluginDriver } from './PluginDriver.ts'
import { applyHookResult } from './renderNode.tsx'
import { fsStorage } from './storages/fsStorage.ts'
import type { AdapterSource, Config, KubbEvents, Plugin, PluginContext, Storage, UserConfig } from './types.ts'
import { getDiagnosticInfo } from './utils/diagnostics.ts'
import type { FileMetaBase } from './utils/getBarrelFiles.ts'
import { getBarrelFiles } from './utils/getBarrelFiles.ts'
import { isInputPath } from './utils/isInputPath.ts'

type BuildOptions = {
  config: UserConfig
  events?: AsyncEventEmitter<KubbEvents>
}

/**
 * Full output produced by a successful or failed build.
 */
type BuildOutput = {
  /**
   * Plugins that threw during installation, paired with the caught error.
   */
  failedPlugins: Set<{ plugin: Plugin; error: Error }>
  fabric: FabricType
  files: Array<KubbFile.ResolvedFile>
  driver: PluginDriver
  /**
   * Elapsed time in milliseconds for each plugin, keyed by plugin name.
   */
  pluginTimings: Map<string, number>
  error?: Error
  /**
   * Raw generated source, keyed by absolute file path.
   */
  sources: Map<KubbFile.Path, string>
}

/**
 * Intermediate result returned by {@link setup} and accepted by {@link safeBuild}.
 */
type SetupResult = {
  events: AsyncEventEmitter<KubbEvents>
  fabric: FabricType
  driver: PluginDriver
  sources: Map<KubbFile.Path, string>
  config: Config
}

/**
 * Initializes all Kubb infrastructure for a build without executing any plugins.
 *
 * - Validates the input path (when applicable).
 * - Applies config defaults (`root`, `output.*`, `devtools`).
 * - Creates the Fabric instance and wires storage, format, and lint hooks.
 * - Runs the adapter (if configured) to produce the universal `RootNode`.
 *   When no adapter is supplied and `@kubb/adapter-oas` is installed as an
 *
 * Pass the returned {@link SetupResult} directly to {@link safeBuild} or {@link build}
 * via the `overrides` argument to reuse the same infrastructure across multiple runs.
 */
export async function setup(options: BuildOptions): Promise<SetupResult> {
  const { config: userConfig, events = new AsyncEventEmitter<KubbEvents>() } = options

  const sources: Map<KubbFile.Path, string> = new Map<KubbFile.Path, string>()
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

  if (!userConfig.adapter) {
    throw new Error('Adapter should be defined')
  }

  const config: Config = {
    root: userConfig.root || process.cwd(),
    ...userConfig,
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
    plugins: userConfig.plugins as Config['plugins'],
  }

  // write: false is the explicit dry-run opt-out; otherwise use the provided
  // storage or fall back to fsStorage (backwards-compatible default).
  // Keys are root-relative (e.g. `src/gen/api/getPets.ts`) so fsStorage()
  // needs no configuration — it resolves them against process.cwd().
  const storage: Storage | null = config.output.write === false ? null : (config.output.storage ?? fsStorage())

  if (config.output.clean) {
    await events.emit('debug', {
      date: new Date(),
      logs: ['Cleaning output directories', `  • Output: ${config.output.path}`],
    })
    await storage?.clear(resolve(config.root, config.output.path))
  }

  const fabric = createFabric()
  fabric.use(fsPlugin)

  for (const parser of config.parsers) {
    fabric.use(parser)
  }
  // Catch-all fallback: joins all source values for any unhandled extension
  fabric.use(
    defineParser({
      name: 'fallback',
      extNames: undefined,
      parse(file) {
        return file.sources
          .map((item) => item.value)
          .filter((value): value is string => value != null)
          .join('\n\n')
      },
    }),
  )

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
      config: config,
      source,
    })

    if (source) {
      // Key is root-relative so it's meaningful for any backend (fs, S3, Redis…)
      const key = relative(resolve(config.root), file.path)
      await storage?.setItem(key, source)
      sources.set(file.path, source)
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
    logs: ['✓ Fabric initialized', `  • Storage: ${storage ? storage.name : 'disabled (dry-run)'}`, `  • Barrel type: ${config.output.barrelType || 'none'}`],
  })

  const driver = new PluginDriver(config, {
    fabric,
    events,
    concurrency: DEFAULT_CONCURRENCY,
  })

  // Run the adapter to produce the universal RootNode.

  const adapter = config.adapter
  if (!adapter) {
    throw new Error('No adapter configured. Please provide an adapter in your kubb.config.ts.')
  }
  const source = inputToAdapterSource(config)

  await events.emit('debug', {
    date: new Date(),
    logs: [`Running adapter: ${adapter.name}`],
  })

  driver.adapter = adapter
  driver.rootNode = await adapter.parse(source)

  await events.emit('debug', {
    date: new Date(),
    logs: [
      `✓ Adapter '${adapter.name}' resolved RootNode`,
      `  • Schemas: ${driver.rootNode.schemas.length}`,
      `  • Operations: ${driver.rootNode.operations.length}`,
    ],
  })

  return {
    config,
    events,
    fabric,
    driver,
    sources,
  }
}

/**
 * Runs a full Kubb build and throws on any error or plugin failure.
 *
 * Internally delegates to {@link safeBuild} and rethrows collected errors.
 * Pass an existing {@link SetupResult} via `overrides` to skip the setup phase.
 */
export async function build(options: BuildOptions, overrides?: SetupResult): Promise<BuildOutput> {
  const { fabric, files, driver, failedPlugins, pluginTimings, error, sources } = await safeBuild(options, overrides)

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
    driver,
    pluginTimings,
    error: undefined,
    sources,
  }
}

/**
 * Walks the AST and dispatches nodes to a plugin's direct AST hooks
 * (`schema`, `operation`, `operations`).
 *
 * - Each hook accepts a single handler **or an array** — all entries are called in sequence.
 * - Nodes that are excluded by `exclude`/`include` plugin options are skipped automatically.
 * - Return values are handled via `applyHookResult`: React elements are rendered,
 *   `KubbFile.File[]` are written via upsert, and `void` is a no-op (manual handling).
 * - Barrel files are generated automatically when `output.barrelType` is set.
 */
async function runPluginAstHooks(plugin: Plugin, context: PluginContext): Promise<void> {
  const { adapter, rootNode, resolver, fabric } = context
  const { exclude, include, override } = plugin.options

  if (!adapter || !rootNode) {
    throw new Error(`[${plugin.name}] No adapter found. Add an OAS adapter (e.g. pluginOas()) before this plugin in your Kubb config.`)
  }

  const collectedOperations: Array<OperationNode> = []

  await walk(rootNode, {
    depth: 'shallow',
    async schema(node) {
      if (!plugin.schema) return
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node
      const options = resolver.resolveOptions(transformedNode, { options: plugin.options, exclude, include, override })
      if (options === null) return
      const result = await plugin.schema.call(context, transformedNode, options)

      await applyHookResult(result, fabric)
    },
    async operation(node) {
      const transformedNode = plugin.transformer ? transform(node, plugin.transformer) : node
      const options = resolver.resolveOptions(transformedNode, { options: plugin.options, exclude, include, override })
      if (options !== null) {
        collectedOperations.push(transformedNode)
        if (plugin.operation) {
          const result = await plugin.operation.call(context, transformedNode, options)
          await applyHookResult(result, fabric)
        }
      }
    },
  })

  if (plugin.operations && collectedOperations.length > 0) {
    const result = await plugin.operations.call(context, collectedOperations, plugin.options)

    await applyHookResult(result, fabric)
  }
}

/**
 * Runs a full Kubb build and captures errors instead of throwing.
 *
 * - Installs each plugin in order, recording failures in `failedPlugins`.
 * - Generates the root barrel file when `output.barrelType` is set.
 * - Writes all files through Fabric.
 *
 * Returns a {@link BuildOutput} even on failure — inspect `error` and
 * `failedPlugins` to determine whether the build succeeded.
 */
export async function safeBuild(options: BuildOptions, overrides?: SetupResult): Promise<BuildOutput> {
  const { fabric, driver, events, sources } = overrides ? overrides : await setup(options)

  const failedPlugins = new Set<{ plugin: Plugin; error: Error }>()
  // in ms
  const pluginTimings = new Map<string, number>()
  const config = driver.config

  try {
    for (const plugin of driver.plugins.values()) {
      const context = driver.getContext(plugin)
      const hrStart = process.hrtime()
      const { output } = plugin.options ?? {}
      const root = resolve(config.root, config.output.path)

      try {
        const timestamp = new Date()

        await events.emit('plugin:start', plugin)

        await events.emit('debug', {
          date: timestamp,
          logs: ['Starting plugin...', `  • Plugin Name: ${plugin.name}`],
        })

        // Call buildStart() for any custom plugin logic
        await plugin.buildStart.call(context)

        // Dispatch schema/operation/operations hooks (direct hooks or composed via composeGenerators)
        if (plugin.schema || plugin.operation || plugin.operations) {
          await runPluginAstHooks(plugin, context)
        }

        if (output) {
          const barrelFiles = await getBarrelFiles(fabric.files, {
            type: output.barrelType ?? 'named',
            root,
            output,
            meta: { pluginName: plugin.name },
          })
          await context.upsertFile(...barrelFiles)
        }

        const duration = getElapsedMs(hrStart)
        pluginTimings.set(plugin.name, duration)

        await events.emit('plugin:end', plugin, { duration, success: true })

        await events.emit('debug', {
          date: new Date(),
          logs: [`✓ Plugin started successfully (${formatMs(duration)})`],
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

      const existingBarrel = fabric.files.find((f) => f.path === rootPath)
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

      await fabric.upsertFile(rootFile)

      await events.emit('debug', {
        date: new Date(),
        logs: [`✓ Generated barrel file (${rootFile.exports?.length || 0} exports)`],
      })
    }

    const files = [...fabric.files]

    await fabric.write({ extension: config.output.extension })

    // Call buildEnd() on each plugin after all files are written
    for (const plugin of driver.plugins.values()) {
      if (plugin.buildEnd) {
        const context = driver.getContext(plugin)
        await plugin.buildEnd.call(context)
      }
    }

    return {
      failedPlugins,
      fabric,
      files,
      driver,
      pluginTimings,
      sources,
    }
  } catch (error) {
    return {
      failedPlugins,
      fabric,
      files: [],
      driver,
      pluginTimings,
      error: error as Error,
      sources,
    }
  }
}

type BuildBarrelExportsParams = {
  barrelFiles: KubbFile.ResolvedFile[]
  rootDir: string
  existingExports: Set<string>
  config: Config
  driver: PluginDriver
}

function buildBarrelExports({ barrelFiles, rootDir, existingExports, config, driver }: BuildBarrelExportsParams): KubbFile.Export[] {
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
        {
          name: exportName,
          path: getRelativePath(rootDir, file.path),
          isTypeOnly: config.output.barrelType === 'all' ? containsOnlyTypes : source.isTypeOnly,
        } satisfies KubbFile.Export,
      ]
    })
  })
}

/**
 * Maps the resolved `Config['input']` shape into an `AdapterSource` that
 * the adapter's `parse()` can consume.
 */
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
