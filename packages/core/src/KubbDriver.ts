import { resolve } from 'node:path'
import { arrayToAsyncIterable, type AsyncEventEmitter, forBatches, formatMs, getElapsedMs, isPromise, memoize, URLPath } from '@internals/utils'
import { collectUsedSchemaNames, createFile, createStreamInput, transform } from '@kubb/ast'
import type { FileNode, InputMeta, InputNode, InputStreamNode, OperationNode, SchemaNode } from '@kubb/ast'
import { DEFAULT_STUDIO_URL, SCHEMA_PARALLEL, STREAM_FLUSH_EVERY } from './constants.ts'
import type { Storage } from './createStorage.ts'
import type { Generator } from './defineGenerator.ts'
import type { Parser } from './defineParser.ts'
import type { Plugin } from './definePlugin.ts'
import { getMode } from './definePlugin.ts'
import { defineResolver } from './defineResolver.ts'
import { openInStudio as openInStudioFn } from './devtools.ts'
import { FileManager } from './FileManager.ts'
import { FileProcessor } from './FileProcessor.ts'
import type { Renderer, RendererFactory } from './createRenderer.ts'

import type {
  Adapter,
  AdapterSource,
  Config,
  DevtoolsOptions,
  GeneratorContext,
  KubbHooks,
  KubbPluginSetupContext,
  Middleware,
  NormalizedPlugin,
  PluginFactoryOptions,
  Resolver,
} from './types.ts'

type Options = {
  hooks: AsyncEventEmitter<KubbHooks>
}

function enforceOrder(enforce: 'pre' | 'post' | undefined): number {
  return enforce === 'pre' ? -1 : enforce === 'post' ? 1 : 0
}

const OPERATION_FILTER_TYPES = new Set(['tag', 'operationId', 'path', 'method', 'contentType'])

export class KubbDriver {
  readonly config: Config
  readonly options: Options

  /**
   * Returns `'single'` when `fileOrFolder` has a file extension, `'split'` otherwise.
   *
   * @example
   * ```ts
   * KubbDriver.getMode('src/gen/types.ts')  // 'single'
   * KubbDriver.getMode('src/gen/types')     // 'split'
   * ```
   */
  static getMode(fileOrFolder: string | undefined | null): 'single' | 'split' {
    return getMode(fileOrFolder)
  }

  /**
   * The streaming `InputStreamNode` produced by the adapter.
   * Always set after adapter setup — parse-only adapters are wrapped automatically.
   */
  inputNode: InputStreamNode | null = null
  adapter: Adapter | null = null
  /**
   * Studio session state, kept together so `dispose()` can reset it atomically.
   *
   * - `source` holds the raw adapter source so `adapter.parse()` can be called lazily.
   *   Intentionally outlives the build; cleared by `dispose()`.
   * - `isOpen` prevents opening the studio more than once per build.
   * - `inputNode` caches the parse promise so `adapter.parse()` is called at most once
   *   per studio session, even when `openInStudio()` is called multiple times.
   */
  #studio: { source: AdapterSource | null; isOpen: boolean; inputNode: Promise<InputNode> | null } = {
    source: null,
    isOpen: false,
    inputNode: null,
  }

  // Register middleware hooks after all plugin hooks are registered.
  // Because AsyncEventEmitter calls listeners in registration order,
  // middleware hooks for any event fire after all plugin hooks for that event.
  // Handlers are tracked so they can be removed after each build (disposeMiddleware),
  // preventing accumulation when multiple configs share the same hooks instance.
  #middlewareListeners: Array<[keyof KubbHooks & string, (...args: Array<never>) => void | Promise<void>]> = []

  /**
   * Central file store for all generated files.
   * Plugins should use `this.addFile()` / `this.upsertFile()` (via their context) to
   * add files; this property gives direct read/write access when needed.
   */
  readonly fileManager = new FileManager()
  readonly #fileProcessor = new FileProcessor()

  readonly plugins = new Map<string, NormalizedPlugin>()

  /**
   * Tracks which plugins have generators registered via `addGenerator()` (event-based path).
   * Used by the build loop to decide whether to emit generator events for a given plugin.
   */
  readonly #eventGeneratorPlugins = new Set<string>()
  readonly #resolvers = new Map<string, Resolver>()
  readonly #defaultResolvers = new Map<string, Resolver>()
  readonly #hookListeners = new Map<keyof KubbHooks, Set<(...args: Array<never>) => void | Promise<void>>>()

  constructor(config: Config, options: Options) {
    this.config = config
    this.options = options
    this.adapter = config.adapter ?? null
  }

  async setup() {
    const normalized: Array<NormalizedPlugin> = this.config.plugins.map((rawPlugin) => this.#normalizePlugin(rawPlugin as Plugin))

    normalized.sort((a, b) => {
      if (b.dependencies?.includes(a.name)) return -1
      if (a.dependencies?.includes(b.name)) return 1

      return enforceOrder(a.enforce) - enforceOrder(b.enforce)
    })

    for (const plugin of normalized) {
      if (plugin.apply) {
        plugin.apply(this.config)
      }

      this.#registerPlugin(plugin)
      this.plugins.set(plugin.name, plugin)
    }

    if (this.config.middleware) {
      for (const middleware of this.config.middleware) {
        for (const event of Object.keys(middleware.hooks) as Array<keyof KubbHooks & string>) {
          this.#registerMiddleware(event, middleware.hooks)
        }
      }
    }
    if (this.config.adapter) {
      await this.#registerAdapter(this.config.adapter)
    }
  }

  get hooks() {
    return this.options.hooks
  }

  /**
   * Creates an `NormalizedPlugin` from a hook-style plugin and registers
   * its lifecycle handlers on the `AsyncEventEmitter`.
   */
  #normalizePlugin(plugin: Plugin): NormalizedPlugin {
    const normalized: NormalizedPlugin = {
      name: plugin.name,
      dependencies: plugin.dependencies,
      enforce: plugin.enforce,
      hooks: plugin.hooks,
      options: plugin.options ?? { output: { path: '.' }, exclude: [], override: [] },
    } as NormalizedPlugin

    if ('apply' in plugin && typeof plugin.apply === 'function') {
      normalized.apply = plugin.apply as (config: Config) => boolean
    }

    return normalized
  }

  async #registerAdapter(adapter: Adapter) {
    const source = inputToAdapterSource(this.config)
    this.#studio.source = source

    if (adapter.stream) {
      this.inputNode = await adapter.stream(source)

      await this.hooks.emit('kubb:debug', {
        date: new Date(),
        logs: [`✓ Adapter '${adapter.name}' producing input stream`],
      })
    } else {
      // Adapter does not implement stream() — eagerly parse and wrap in a
      // reusable AsyncIterable so the rest of the pipeline stays stream-only.
      const inputNode = await adapter.parse(source)
      this.inputNode = createStreamInput(arrayToAsyncIterable(inputNode.schemas), arrayToAsyncIterable(inputNode.operations), inputNode.meta)

      await this.hooks.emit('kubb:debug', {
        date: new Date(),
        logs: [
          `✓ Adapter '${adapter.name}' resolved InputNode (wrapped as stream)`,
          `  • Schemas: ${inputNode.schemas.length}`,
          `  • Operations: ${inputNode.operations.length}`,
        ],
      })
    }
  }

  #registerMiddleware<K extends keyof KubbHooks & string>(event: K, middlewareHooks: Middleware['hooks']) {
    const handler = middlewareHooks[event]

    if (!handler) {
      return
    }

    this.hooks.on(event, handler)
    this.#middlewareListeners.push([event, handler as (...args: Array<never>) => void | Promise<void>])
  }

  /**
   * Registers a hook-style plugin's lifecycle handlers on the shared `AsyncEventEmitter`.
   *
   * For `kubb:plugin:setup`, the registered listener wraps the globally emitted context with a
   * plugin-specific one so that `addGenerator`, `setResolver`, `setTransformer`, and
   * `setRenderer` all target the correct `normalizedPlugin` entry in the plugins map.
   *
   * All other hooks are iterated and registered directly as pass-through listeners.
   * Any event key present in the global `KubbHooks` interface can be subscribed to.
   *
   * External tooling can subscribe to any of these events via `hooks.on(...)` to observe
   * the plugin lifecycle without modifying plugin behavior.
   *
   * @internal
   */
  #registerPlugin(plugin: NormalizedPlugin): void {
    const { hooks } = plugin

    if (!hooks) return

    // kubb:plugin:setup gets special treatment: the globally emitted context is wrapped with
    // plugin-specific implementations so that addGenerator / setResolver / etc. target
    // this plugin's normalizedPlugin entry rather than being no-ops.
    if (hooks['kubb:plugin:setup']) {
      const setupHandler = (globalCtx: KubbPluginSetupContext) => {
        const pluginCtx: KubbPluginSetupContext = {
          ...globalCtx,
          options: plugin.options ?? {},
          addGenerator: (gen) => {
            this.registerGenerator(plugin.name, gen)
          },
          setResolver: (resolver) => {
            this.setPluginResolver(plugin.name, resolver)
          },
          setTransformer: (visitor) => {
            plugin.transformer = visitor
          },
          setRenderer: (renderer) => {
            plugin.renderer = renderer
          },
          setOptions: (opts) => {
            plugin.options = { ...plugin.options, ...opts }
          },
          injectFile: (userFileNode) => {
            this.fileManager.add(createFile(userFileNode))
          },
        }
        return hooks['kubb:plugin:setup']!(pluginCtx)
      }

      this.hooks.on('kubb:plugin:setup', setupHandler)
      this.#trackHookListener('kubb:plugin:setup', setupHandler as (...args: Array<never>) => void | Promise<void>)
    }

    // All other hooks are registered as direct pass-through listeners on the shared emitter.
    for (const [event, handler] of Object.entries(hooks) as Array<[keyof KubbHooks, ((...args: Array<never>) => void | Promise<void>) | undefined]>) {
      if (event === 'kubb:plugin:setup' || !handler) continue

      this.hooks.on(event, handler as never)
      this.#trackHookListener(event, handler as (...args: Array<never>) => void | Promise<void>)
    }
  }

  /**
   * Emits the `kubb:plugin:setup` event so that all registered hook-style plugin listeners
   * can configure generators, resolvers, transformers and renderers before `buildStart` runs.
   *
   * Call this once from `safeBuild` before the plugin execution loop begins.
   */
  async emitSetupHooks(): Promise<void> {
    const noop = () => {}

    await this.hooks.emit('kubb:plugin:setup', {
      config: this.config,
      options: {},
      addGenerator: noop,
      setResolver: noop,
      setTransformer: noop,
      setRenderer: noop,
      setOptions: noop,
      injectFile: noop,
      updateConfig: noop,
    })
  }

  /**
   * Registers a generator for the given plugin on the shared event emitter.
   *
   * The generator's `schema`, `operation`, and `operations` methods are registered as
   * listeners on `kubb:generate:schema`, `kubb:generate:operation`, and `kubb:generate:operations`
   * respectively. Each listener is scoped to the owning plugin via a `ctx.plugin.name` check
   * so that generators from different plugins do not cross-fire.
   *
   * The renderer resolution chain is: `generator.renderer → plugin.renderer → config.renderer`.
   * Set `generator.renderer = null` to explicitly opt out of rendering even when the plugin
   * declares a renderer.
   *
   * Call this method inside `addGenerator()` (in `kubb:plugin:setup`) to wire up a generator.
   */
  registerGenerator(pluginName: string, gen: Generator): void {
    const resolveRenderer = () => {
      const plugin = this.plugins.get(pluginName)
      return gen.renderer === null ? undefined : (gen.renderer ?? plugin?.renderer ?? this.config.renderer)
    }

    if (gen.schema) {
      const schemaHandler = async (node: SchemaNode, ctx: GeneratorContext) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await gen.schema!(node, ctx)
        await applyHookResult({ result, driver: this, rendererFactory: resolveRenderer() })
      }

      this.hooks.on('kubb:generate:schema', schemaHandler)
      this.#trackHookListener('kubb:generate:schema', schemaHandler as (...args: Array<never>) => void | Promise<void>)
    }

    if (gen.operation) {
      const operationHandler = async (node: OperationNode, ctx: GeneratorContext) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await gen.operation!(node, ctx)
        await applyHookResult({ result, driver: this, rendererFactory: resolveRenderer() })
      }

      this.hooks.on('kubb:generate:operation', operationHandler)
      this.#trackHookListener('kubb:generate:operation', operationHandler as (...args: Array<never>) => void | Promise<void>)
    }

    if (gen.operations) {
      const operationsHandler = async (nodes: Array<OperationNode>, ctx: GeneratorContext) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await gen.operations!(nodes, ctx)
        await applyHookResult({ result, driver: this, rendererFactory: resolveRenderer() })
      }

      this.hooks.on('kubb:generate:operations', operationsHandler)
      this.#trackHookListener('kubb:generate:operations', operationsHandler as (...args: Array<never>) => void | Promise<void>)
    }

    this.#eventGeneratorPlugins.add(pluginName)
  }

  /**
   * Returns `true` when at least one generator was registered for the given plugin
   * via `addGenerator()` in `kubb:plugin:setup` (event-based path).
   *
   * Used by the build loop to decide whether to walk the AST and emit generator events
   * for a plugin that has no static `plugin.generators`.
   */
  hasEventGenerators(pluginName: string): boolean {
    return this.#eventGeneratorPlugins.has(pluginName)
  }

  /**
   * Runs the full plugin pipeline. Returns timings/failures collected so far even
   * when an outer hook throws — the orchestrator preserves partial state by capturing
   * the error into `error` instead of propagating.
   */
  async run({ storage }: { storage: Storage }): Promise<{
    failedPlugins: Set<{ plugin: Plugin; error: Error }>
    pluginTimings: Map<string, number>
    error?: Error
  }> {
    const hooks = this.hooks
    const config = this.config
    const failedPlugins = new Set<{ plugin: Plugin; error: Error }>()
    const pluginTimings = new Map<string, number>()
    const parsersMap = new Map<FileNode['extname'], Parser>()

    for (const parser of config.parsers) {
      if (parser.extNames) {
        for (const ext of parser.extNames) parsersMap.set(ext, parser)
      }
    }

    const pendingFiles = new Map<string, FileNode>()
    this.fileManager.setOnUpsert((file) => {
      pendingFiles.set(file.path, file)
    })

    try {
      const flushPending = async (): Promise<void> => {
        if (pendingFiles.size === 0) return
        const files = [...pendingFiles.values()]
        pendingFiles.clear()

        await hooks.emit('kubb:debug', { date: new Date(), logs: [`Writing ${files.length} files...`] })
        await hooks.emit('kubb:files:processing:start', { files })

        const items = [...this.#fileProcessor.stream(files, { parsers: parsersMap, extension: config.output.extension })]

        await hooks.emit('kubb:files:processing:update', {
          files: items.map(({ file, source, processed, total, percentage }) => ({ file, source, processed, total, percentage, config })),
        })

        const queue: Array<Promise<void>> = []
        for (const { file, source } of items) {
          if (source) {
            queue.push(storage.setItem(file.path, source))
            if (queue.length >= STREAM_FLUSH_EVERY) await Promise.all(queue.splice(0))
          }
        }
        await Promise.all(queue)

        await hooks.emit('kubb:files:processing:end', { files })
        await hooks.emit('kubb:debug', { date: new Date(), logs: [`✓ File write process completed for ${files.length} files`] })
      }

      await this.emitSetupHooks()

      if (this.adapter && this.inputNode) {
        await hooks.emit(
          'kubb:build:start',
          Object.assign({ config, adapter: this.adapter, meta: this.inputNode.meta, getPlugin: this.getPlugin.bind(this) }, this.#filesPayload()),
        )
      }

      const generatorPlugins: Array<{ plugin: NormalizedPlugin; context: GeneratorContext; hrStart: ReturnType<typeof process.hrtime> }> = []

      for (const plugin of this.plugins.values()) {
        const context = this.getContext(plugin)
        const hrStart = process.hrtime()

        try {
          await hooks.emit('kubb:plugin:start', { plugin })
          await hooks.emit('kubb:debug', { date: new Date(), logs: ['Starting plugin...', `  • Plugin Name: ${plugin.name}`] })
        } catch (caughtError) {
          const error = caughtError as Error
          const duration = getElapsedMs(hrStart)
          pluginTimings.set(plugin.name, duration)
          await this.#emitPluginEnd({ plugin, duration, success: false, error })
          failedPlugins.add({ plugin, error })
          continue
        }

        if (plugin.generators?.length || this.hasEventGenerators(plugin.name)) {
          generatorPlugins.push({ plugin, context, hrStart })
          continue
        }

        const duration = getElapsedMs(hrStart)
        pluginTimings.set(plugin.name, duration)
        await this.#emitPluginEnd({ plugin, duration, success: true })
        await hooks.emit('kubb:debug', { date: new Date(), logs: [`✓ Plugin started successfully (${formatMs(duration)})`] })
      }

      if (generatorPlugins.length > 0) {
        if (this.inputNode) {
          const { timings, failed } = await this.#runGenerators(generatorPlugins, flushPending)
          // Drain any files written after the last batch's flush.
          await flushPending()
          for (const [name, duration] of timings) pluginTimings.set(name, duration)
          for (const entry of failed) failedPlugins.add(entry)
        } else {
          // No adapter input: generator-plugins have nothing to dispatch, but still
          // need their `kubb:plugin:end` so middleware (e.g. barrel) completes.
          for (const { plugin, hrStart } of generatorPlugins) {
            const duration = getElapsedMs(hrStart)
            pluginTimings.set(plugin.name, duration)
            await this.#emitPluginEnd({ plugin, duration, success: true })
          }
        }
      }

      await hooks.emit('kubb:plugins:end', Object.assign({ config }, this.#filesPayload()))

      await flushPending()

      const files = this.fileManager.files

      await hooks.emit('kubb:build:end', { files, config, outputDir: resolve(config.root, config.output.path) })

      return { failedPlugins, pluginTimings }
    } catch (caughtError) {
      return { failedPlugins, pluginTimings, error: caughtError as Error }
    } finally {
      this.fileManager.setOnUpsert(null)
    }
  }

  // Returns a fresh object with a lazy `files` getter and a bound `upsertFile`.
  // Caller must use `Object.assign(extra, this.#filesPayload())`, not object spread —
  // spread would eagerly invoke the getter and freeze a stale snapshot into the payload.
  #filesPayload(): { readonly files: Array<FileNode>; upsertFile: (...files: Array<FileNode>) => Array<FileNode> } {
    const driver = this
    return {
      get files() {
        return driver.fileManager.files
      },
      upsertFile: (...files: Array<FileNode>) => driver.fileManager.upsert(...files),
    }
  }

  #emitPluginEnd({ plugin, duration, success, error }: { plugin: NormalizedPlugin; duration: number; success: boolean; error?: Error }): Promise<void> | void {
    return this.hooks.emit(
      'kubb:plugin:end',
      Object.assign({ plugin, duration, success, ...(error ? { error } : {}), config: this.config }, this.#filesPayload()),
    )
  }

  async #runGenerators(
    entries: Array<{ plugin: NormalizedPlugin; context: GeneratorContext; hrStart: ReturnType<typeof process.hrtime> }>,
    flushPending: () => Promise<void>,
  ): Promise<{ timings: Map<string, number>; failed: Set<{ plugin: Plugin; error: Error }> }> {
    const timings = new Map<string, number>()
    const failed = new Set<{ plugin: Plugin; error: Error }>()
    type PluginState = {
      plugin: NormalizedPlugin
      generatorContext: GeneratorContext
      generators: Array<Generator>
      hrStart: ReturnType<typeof process.hrtime>
      failed: boolean
      error: Error | null
      optionsAreStatic: boolean
      allowedSchemaNames: Set<string> | null
    }

    const driver = this
    const { schemas, operations } = this.inputNode!
    const states: Array<PluginState> = entries.map(({ plugin, context, hrStart }) => {
      const { exclude, include, override } = plugin.options
      const hasExclude = Array.isArray(exclude) && exclude.length > 0
      const hasInclude = Array.isArray(include) && include.length > 0
      const hasOverride = Array.isArray(override) && override.length > 0
      return {
        plugin,
        generatorContext: { ...context, resolver: this.getResolver(plugin.name) },
        generators: plugin.generators ?? [],
        hrStart,
        failed: false,
        error: null,
        optionsAreStatic: !hasExclude && !hasInclude && !hasOverride,
        allowedSchemaNames: null,
      }
    })

    const emitsSchemaHook = this.hooks.listenerCount('kubb:generate:schema') > 0
    const emitsOperationHook = this.hooks.listenerCount('kubb:generate:operation') > 0

    // Pre-scan: plugins with operation-based includes (but no schemaName include) need
    // the reachable schema set. This requires the full schema graph in memory at once —
    // transitive reachability can't be derived from a single node. `allSchemas` is
    // released as soon as the pre-scan returns; the main passes get fresh iterators.
    const pruningStates = states.filter(({ plugin }) => {
      const { include } = plugin.options
      return (include?.some(({ type }) => OPERATION_FILTER_TYPES.has(type)) ?? false) && !(include?.some(({ type }) => type === 'schemaName') ?? false)
    })

    if (pruningStates.length > 0) {
      const allSchemas: Array<SchemaNode> = []
      for await (const schema of schemas) allSchemas.push(schema)

      const includedOpsByState = new Map<PluginState, Array<OperationNode>>(pruningStates.map((s) => [s, []]))
      for await (const operation of operations) {
        for (const state of pruningStates) {
          const { exclude, include, override } = state.plugin.options
          const options = state.generatorContext.resolver.resolveOptions(operation, { options: state.plugin.options, exclude, include, override })
          if (options !== null) includedOpsByState.get(state)?.push(operation)
        }
      }

      for (const state of pruningStates) {
        state.allowedSchemaNames = collectUsedSchemaNames(includedOpsByState.get(state) ?? [], allSchemas)
        includedOpsByState.delete(state)
      }
    }

    const resolveRendererFor = (gen: Generator, state: PluginState): RendererFactory | undefined =>
      gen.renderer === null ? undefined : (gen.renderer ?? state.plugin.renderer ?? state.generatorContext.config.renderer)

    // Schema and operation passes share this body. They differ only in which
    // generator method runs, which hook is emitted, and the schema-only
    // `allowedSchemaNames` prune (operations don't carry that constraint).
    const dispatchNode = async <TNode extends SchemaNode | OperationNode>(
      state: PluginState,
      node: TNode,
      dispatch: {
        method: 'schema' | 'operation'
        checkAllowedNames: boolean
        emit: ((node: TNode, ctx: GeneratorContext) => Promise<void> | void) | null
      },
    ): Promise<void> => {
      if (state.failed) return
      try {
        const { plugin, generatorContext, generators } = state
        const transformedNode: TNode = plugin.transformer ? (transform(node, plugin.transformer) as TNode) : node

        if (
          dispatch.checkAllowedNames &&
          state.allowedSchemaNames !== null &&
          'name' in transformedNode &&
          transformedNode.name &&
          !state.allowedSchemaNames.has(transformedNode.name)
        ) {
          return
        }

        const { exclude, include, override } = plugin.options
        const options = state.optionsAreStatic
          ? plugin.options
          : generatorContext.resolver.resolveOptions(transformedNode, { options: plugin.options, exclude, include, override })
        if (options === null) return

        const ctx = { ...generatorContext, options }
        for (const gen of generators) {
          const generate = gen[dispatch.method] as ((node: TNode, ctx: GeneratorContext) => unknown) | undefined
          if (!generate) continue
          const raw = generate(transformedNode, ctx)
          const result = isPromise(raw) ? await raw : raw
          const applied = applyHookResult({ result, driver, rendererFactory: resolveRendererFor(gen, state) })
          if (isPromise(applied)) await applied
        }
        if (dispatch.emit) await dispatch.emit(transformedNode, ctx)
      } catch (caughtError) {
        state.failed = true
        state.error = caughtError as Error
      }
    }

    const schemaDispatch = {
      method: 'schema',
      checkAllowedNames: true,
      emit: emitsSchemaHook ? (node: SchemaNode, ctx: GeneratorContext) => this.hooks.emit('kubb:generate:schema', node, ctx) : null,
    } as const
    const operationDispatch = {
      method: 'operation',
      checkAllowedNames: false,
      emit: emitsOperationHook ? (node: OperationNode, ctx: GeneratorContext) => this.hooks.emit('kubb:generate:operation', node, ctx) : null,
    } as const

    // Skip building the aggregated operations array when nothing consumes it.
    // Saves an N-sized allocation that lives until the build ends, on the common
    // path where plugins only define per-node `gen.operation`.
    const needsCollectedOperations = this.hooks.listenerCount('kubb:generate:operations') > 0 || states.some((s) => s.generators.some((g) => !!g.operations))
    const collectedOperations: Array<OperationNode> = needsCollectedOperations ? [] : (undefined as never)

    // Run schemas before operations: the two passes share `flushPending` and the
    // FileProcessor's event emitter, so running them concurrently would interleave
    // `kubb:files:processing:start|end` events and race on the shared dirty list.
    await forBatches(schemas, (nodes) => Promise.all(nodes.flatMap((n) => states.map((state) => dispatchNode(state, n, schemaDispatch)))), {
      concurrency: SCHEMA_PARALLEL,
      flush: flushPending,
    })

    await forBatches(
      operations,
      (nodes) => {
        if (needsCollectedOperations) collectedOperations.push(...nodes)
        return Promise.all(nodes.flatMap((n) => states.map((state) => dispatchNode(state, n, operationDispatch))))
      },
      { concurrency: SCHEMA_PARALLEL, flush: flushPending },
    )

    for (const state of states) {
      if (!state.failed && needsCollectedOperations) {
        try {
          const { plugin, generatorContext, generators } = state
          const ctx = { ...generatorContext, options: plugin.options }
          // Filter to operations this plugin would have dispatched to gen.operation():
          // excludes/includes/overrides that resolve to null in dispatchOperation must also
          // be hidden from the batched gen.operations() hook, otherwise grouped/barrel
          // generators emit references to operation files that the per-op hook intentionally skipped.
          const pluginOperations = state.optionsAreStatic
            ? collectedOperations
            : collectedOperations.filter((node) => {
                const transformed = plugin.transformer ? transform(node, plugin.transformer) : node
                const { exclude, include, override } = plugin.options

                return generatorContext.resolver.resolveOptions(transformed, { options: plugin.options, exclude, include, override }) !== null
              })
          for (const gen of generators) {
            if (!gen.operations) continue
            const result = await gen.operations(pluginOperations, ctx)
            await applyHookResult({ result, driver, rendererFactory: resolveRendererFor(gen, state) })
          }
          await this.hooks.emit('kubb:generate:operations', pluginOperations, ctx)
        } catch (caughtError) {
          state.failed = true
          state.error = caughtError as Error
        }
      }

      const duration = getElapsedMs(state.hrStart)
      timings.set(state.plugin.name, duration)
      await this.#emitPluginEnd({ plugin: state.plugin, duration, success: !state.failed, error: state.failed && state.error ? state.error : undefined })

      if (state.failed && state.error) failed.add({ plugin: state.plugin, error: state.error })

      await this.hooks.emit('kubb:debug', {
        date: new Date(),
        logs: [state.failed ? '✗ Plugin start failed' : `✓ Plugin started successfully (${formatMs(duration)})`],
      })
    }

    return { timings, failed }
  }

  /**
   * Unregisters all plugin lifecycle listeners from the shared event emitter.
   * Called at the end of a build to prevent listener leaks across repeated builds.
   *
   * @internal
   */
  dispose(): void {
    for (const [event, handlers] of this.#hookListeners) {
      for (const handler of handlers) {
        this.hooks.off(event, handler as never)
      }
    }

    this.#hookListeners.clear()
    this.#eventGeneratorPlugins.clear()
    // Release resolver closures — the driver is rebuilt for each build() call
    // so there is no value in retaining these maps after disposal.
    this.#resolvers.clear()
    this.#defaultResolvers.clear()
    // Release the FileNode cache, parsed adapter graph, and studio state so
    // memory is reclaimed between builds. The returned `BuildOutput.files`
    // array still references any FileNodes the caller needs to inspect.
    this.fileManager.dispose()
    this.#fileProcessor.dispose()
    this.inputNode = null
    this.#studio = { source: null, isOpen: false, inputNode: null }

    for (const [event, handler] of this.#middlewareListeners) {
      this.hooks.off(event, handler as never)
    }
  }

  [Symbol.dispose](): void {
    this.dispose()
  }

  #trackHookListener(event: keyof KubbHooks, handler: (...args: Array<never>) => void | Promise<void>): void {
    let handlers = this.#hookListeners.get(event)
    if (!handlers) {
      handlers = new Set()
      this.#hookListeners.set(event, handlers)
    }
    handlers.add(handler)
  }

  #getDefaultResolver = memoize(
    this.#defaultResolvers,
    (pluginName: string): Resolver => defineResolver<PluginFactoryOptions>(() => ({ name: 'default', pluginName })),
  )

  /**
   * Merges `partial` with the plugin's default resolver and stores the result.
   * Also mirrors it onto `plugin.resolver` so callers using `getPlugin(name).resolver`
   * get the up-to-date resolver without going through `getResolver()`.
   */
  setPluginResolver(pluginName: string, partial: Partial<Resolver>): void {
    const defaultResolver = this.#getDefaultResolver(pluginName)
    const merged = { ...defaultResolver, ...partial }
    this.#resolvers.set(pluginName, merged)
    const plugin = this.plugins.get(pluginName)
    if (plugin) {
      plugin.resolver = merged
    }
  }

  /**
   * Returns the resolver for the given plugin.
   *
   * Resolution order: dynamic resolver set via `setPluginResolver` → static resolver on the
   * plugin → lazily created default resolver (identity name, no path transforms).
   */
  getResolver<TName extends keyof Kubb.PluginRegistry>(pluginName: TName): Kubb.PluginRegistry[TName]['resolver']
  getResolver<TResolver extends Resolver = Resolver>(pluginName: string): TResolver
  getResolver(pluginName: string): Resolver {
    return this.#resolvers.get(pluginName) ?? this.plugins.get(pluginName)?.resolver ?? this.#getDefaultResolver(pluginName)
  }

  getContext<TOptions extends PluginFactoryOptions>(plugin: NormalizedPlugin<TOptions>): GeneratorContext<TOptions> & Record<string, unknown> {
    const driver = this

    return {
      config: driver.config,
      get root(): string {
        return resolve(driver.config.root, driver.config.output.path)
      },
      getMode(output: { path: string }): 'single' | 'split' {
        return KubbDriver.getMode(resolve(driver.config.root, driver.config.output.path, output.path))
      },
      hooks: driver.hooks,
      plugin,
      getPlugin: driver.getPlugin.bind(driver),
      requirePlugin: driver.requirePlugin.bind(driver),
      getResolver: driver.getResolver.bind(driver),
      driver,
      addFile: async (...files: Array<FileNode>) => {
        driver.fileManager.add(...files)
      },
      upsertFile: async (...files: Array<FileNode>) => {
        driver.fileManager.upsert(...files)
      },
      get meta(): InputMeta {
        return driver.inputNode?.meta ?? { circularNames: [], enumNames: [] }
      },
      get adapter(): Adapter | null {
        return driver.adapter
      },
      get resolver() {
        return driver.getResolver(plugin.name)
      },
      get transformer() {
        return plugin.transformer
      },
      warn(message: string) {
        driver.hooks.emit('kubb:warn', { message })
      },
      error(error: string | Error) {
        driver.hooks.emit('kubb:error', { error: typeof error === 'string' ? new Error(error) : error })
      },
      info(message: string) {
        driver.hooks.emit('kubb:info', { message })
      },
      async openInStudio(options?: DevtoolsOptions) {
        if (!driver.config.devtools || driver.#studio.isOpen) {
          return
        }

        if (typeof driver.config.devtools !== 'object') {
          throw new Error('Devtools must be an object')
        }

        if (!driver.adapter || !driver.#studio.source) {
          throw new Error('adapter is not defined, make sure you have set the parser in kubb.config.ts')
        }

        driver.#studio.isOpen = true

        const studioUrl = driver.config.devtools?.studioUrl ?? DEFAULT_STUDIO_URL
        driver.#studio.inputNode ??= Promise.resolve(driver.adapter.parse(driver.#studio.source))
        const inputNode = await driver.#studio.inputNode

        return openInStudioFn(inputNode, studioUrl, options)
      },
    } as unknown as GeneratorContext<TOptions>
  }

  getPlugin<TName extends keyof Kubb.PluginRegistry>(pluginName: TName): Plugin<Kubb.PluginRegistry[TName]> | undefined
  getPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(pluginName: string): Plugin<TOptions> | undefined
  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName)
  }

  /**
   * Like `getPlugin` but throws a descriptive error when the plugin is not found.
   */
  requirePlugin<TName extends keyof Kubb.PluginRegistry>(pluginName: TName): Plugin<Kubb.PluginRegistry[TName]>
  requirePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(pluginName: string): Plugin<TOptions>
  requirePlugin(pluginName: string): Plugin {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      throw new Error(`[kubb] Plugin "${pluginName}" is required but not found. Make sure it is included in your Kubb config.`)
    }
    return plugin
  }
}

/**
 * Handles the return value of a plugin AST hook or generator method.
 *
 * - Renderer output → rendered via the provided `rendererFactory` (e.g. JSX), files stored in `driver.fileManager`
 * - `Array<FileNode>` → added directly into `driver.fileManager`
 * - `void` / `null` / `undefined` → no-op (plugin handled it via `this.upsertFile`)
 *
 * Pass a `rendererFactory` (e.g. `jsxRenderer` from `@kubb/renderer-jsx`) when the result
 * may be a renderer element. Generators that only return `Array<FileNode>` do not need one.
 */
export function applyHookResult<TElement = unknown>({
  result,
  driver,
  rendererFactory,
}: {
  result: TElement | Array<FileNode> | undefined | null
  driver: KubbDriver
  rendererFactory?: RendererFactory<TElement> | null
}): void | Promise<void> {
  if (!result) return

  if (Array.isArray(result)) {
    driver.fileManager.upsert(...(result as Array<FileNode>))
    return
  }

  if (!rendererFactory) {
    return
  }

  const renderer = rendererFactory()
  if (renderer.stream) {
    using r = renderer
    for (const file of r.stream!(result)) {
      driver.fileManager.upsert(file)
    }
    return
  }
  return applyAsyncRender({ renderer, result, driver })
}

async function applyAsyncRender<TElement>({ renderer, result, driver }: { renderer: Renderer<TElement>; result: TElement; driver: KubbDriver }): Promise<void> {
  using r = renderer
  await r.render(result)
  driver.fileManager.upsert(...r.files)
}

function inputToAdapterSource(config: Config): AdapterSource {
  const input = config.input
  if (!input) {
    throw new Error('[kubb] input is required when using an adapter. Provide input.path or input.data in your config.')
  }

  if ('data' in input) {
    return { type: 'data', data: input.data }
  }

  if (new URLPath(input.path).isURL) {
    return { type: 'path', path: input.path }
  }

  const resolved = resolve(config.root, input.path)

  return { type: 'path', path: resolved }
}
