import { resolve } from 'node:path'
import { arrayToAsyncIterable, type AsyncEventEmitter, getElapsedMs, isPromise, memoize, Url } from '@internals/utils'
import { collectUsedSchemaNames } from '@kubb/ast/utils'
import { ast, type Enforce, type FileNode, type InputMeta, type InputNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import { GENERATE_FLUSH_EVERY, OPERATION_FILTER_TYPES } from './constants.ts'
import { type Diagnostic, Diagnostics, type ProblemDiagnostic } from './diagnostics.ts'
import type { RendererFactory } from './createRenderer.ts'
import type { Storage } from './createStorage.ts'
import type { Generator } from './defineGenerator.ts'
import type { Parser } from './defineParser.ts'
import type { Plugin } from './definePlugin.ts'
import { normalizeOutput } from './definePlugin.ts'
import { defineResolver } from './defineResolver.ts'
import { FileManager } from './FileManager.ts'
import { FileProcessor } from './FileProcessor.ts'
import { Transform } from './Transform.ts'

import type {
  Adapter,
  AdapterSource,
  Config,
  GeneratorContext,
  Group,
  KubbHooks,
  KubbPluginSetupContext,
  NormalizedPlugin,
  PluginFactoryOptions,
  Resolver,
} from './types.ts'

type Options = {
  hooks: AsyncEventEmitter<KubbHooks>
}

type HookListener<TArgs extends Array<unknown>, TResult = void> = (...args: TArgs) => TResult | Promise<TResult>

type ListenerEntry = [event: keyof KubbHooks & string, handler: HookListener<Array<unknown>, unknown>]

type RequirePluginContext = {
  /**
   * Name of the plugin that declared the dependency, included in the error so users can
   * trace which plugin needs the missing one.
   */
  requiredBy?: string
}

function enforceOrder(enforce: Enforce | undefined): number {
  return enforce === 'pre' ? -1 : enforce === 'post' ? 1 : 0
}

export class KubbDriver {
  readonly config: Config
  readonly options: Options

  /**
   * The streaming `InputNode<true>` produced by the adapter. Set after adapter setup.
   * Parse-only adapters are wrapped automatically.
   */
  inputNode: InputNode<true> | null = null
  adapter: Adapter | null = null
  /**
   * Raw adapter source so `adapter.parse()` / `adapter.stream()` can run lazily.
   * Intentionally outlives the build, cleared by `dispose()`.
   */
  #adapterSource: AdapterSource | null = null

  /**
   * Central file store for all generated files.
   * Plugins should use `this.addFile()` / `this.upsertFile()` (via their context) to
   * add files. This property gives direct read/write access when needed.
   */
  readonly fileManager = new FileManager()
  readonly plugins = new Map<string, NormalizedPlugin>()

  /**
   * Tracks which plugins have generators registered via `addGenerator()` (event-based path).
   * Used by the build loop to decide whether to emit generator events for a given plugin.
   */
  readonly #eventGeneratorPlugins = new Set<string>()
  readonly #resolvers = new Map<string, Resolver>()
  readonly #defaultResolvers = new Map<string, Resolver>()

  /**
   * Tracks every listener the driver added (plugin, generator) so `dispose()` can remove them
   * in one pass. External `hooks.on(...)` listeners are not tracked.
   */
  readonly #listeners: Array<ListenerEntry> = []

  /**
   * Transform registry. Plugins populate it during `kubb:plugin:setup` via `addMacro`/`setMacros`,
   * and `#runGenerators` reads it once per `(plugin, node)` pair through `applyTo`.
   */
  readonly #transforms = new Transform()

  constructor(config: Config, options: Options) {
    this.config = config
    this.options = options
    this.adapter = config.adapter ?? null
  }

  /**
   * Attaches a listener to the shared emitter and tracks it so `dispose()` can remove it later.
   * Listeners attached directly via `hooks.on(...)` are not tracked and survive disposal.
   */
  #trackListener<K extends keyof KubbHooks & string>(event: K, handler: HookListener<KubbHooks[K], unknown>): void {
    this.hooks.on(event, handler as HookListener<KubbHooks[K]>)
    this.#listeners.push([event, handler as HookListener<Array<unknown>, unknown>])
  }

  /**
   * Normalizes every configured plugin, orders them, and registers their lifecycle handlers.
   * A plugin that another lists as a dependency runs first, then `enforce: 'pre'` before
   * `'post'`. When the config has an adapter, the adapter source is resolved from the input
   * so `run` can parse it later.
   */
  async setup() {
    const normalized: Array<NormalizedPlugin> = this.config.plugins.map((rawPlugin) => this.#normalizePlugin(rawPlugin as Plugin))

    const dependenciesByName = new Map(normalized.map((plugin) => [plugin.name, new Set(plugin.dependencies ?? [])]))

    normalized.sort((a, b) => {
      if (dependenciesByName.get(b.name)?.has(a.name)) return -1
      if (dependenciesByName.get(a.name)?.has(b.name)) return 1

      return enforceOrder(a.enforce) - enforceOrder(b.enforce)
    })

    for (const plugin of normalized) {
      if (plugin.apply) {
        plugin.apply(this.config)
      }

      this.#registerPlugin(plugin)
      this.plugins.set(plugin.name, plugin)
    }

    if (this.config.adapter) {
      this.#adapterSource = inputToAdapterSource(this.config)
    }
  }

  get hooks() {
    return this.options.hooks
  }

  /**
   * Builds a `NormalizedPlugin` from a hook-style plugin, filling in default
   * options and copying `apply` when present. Registering its lifecycle handlers
   * on the `AsyncEventEmitter` is done separately by `#registerPlugin`.
   */
  #normalizePlugin(plugin: Plugin): NormalizedPlugin {
    const normalized: NormalizedPlugin = {
      name: plugin.name,
      dependencies: plugin.dependencies,
      enforce: plugin.enforce,
      hooks: plugin.hooks,
      options: plugin.options ?? { output: { path: '.', mode: 'directory' }, exclude: [], override: [] },
    } as NormalizedPlugin

    if ('apply' in plugin && typeof plugin.apply === 'function') {
      normalized.apply = plugin.apply as (config: Config) => boolean
    }

    return normalized
  }

  /**
   * Parses the adapter source into `this.inputNode`. Idempotent, so repeated calls from
   * `run` do not re-parse. Adapters with `stream()` are used directly.
   * Adapters with only `parse()` are wrapped via `ast.factory.createInput({ stream: true })` so the dispatch loop
   * stays stream-only.
   */
  async #parseInput(): Promise<void> {
    if (this.inputNode || !this.adapter || !this.#adapterSource) return

    const adapter = this.adapter
    const source = this.#adapterSource

    if (adapter.stream) {
      this.inputNode = await adapter.stream(source)
      return
    }

    const parsed = await adapter.parse(source)
    this.inputNode = ast.factory.createInput({
      stream: true,
      schemas: arrayToAsyncIterable(parsed.schemas),
      operations: arrayToAsyncIterable(parsed.operations),
      meta: parsed.meta,
    })
  }

  /**
   * Registers a hook-style plugin's lifecycle handlers on the shared `AsyncEventEmitter`.
   *
   * The `kubb:plugin:setup` listener wraps the global context in a plugin-specific one so
   * `addGenerator`, `setResolver`, and `setMacros` target the right `normalizedPlugin`.
   * Every other `KubbHooks` event registers as a pass-through listener that external tooling
   * can observe via `hooks.on(...)`.
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
          addGenerator: (...generators) => {
            for (const generator of generators.flat()) {
              this.registerGenerator(plugin.name, generator)
            }
          },
          setResolver: (resolver) => {
            this.setPluginResolver(plugin.name, resolver)
          },
          addMacro: (macro) => {
            this.#transforms.add(plugin.name, macro)
          },
          setMacros: (macros) => {
            this.#transforms.set(plugin.name, macros)
          },
          setOptions: (opts) => {
            plugin.options = { ...plugin.options, ...opts }
            if (plugin.options.output) {
              const group = 'group' in plugin.options ? (plugin.options.group as Group | null | undefined) : undefined
              plugin.options.output = normalizeOutput({ output: plugin.options.output, group, pluginName: plugin.name })
            }
          },
          injectFile: (userFileNode) => {
            this.fileManager.add(ast.factory.createFile(userFileNode))
          },
        }
        return hooks['kubb:plugin:setup']!(pluginCtx)
      }

      this.#trackListener('kubb:plugin:setup', setupHandler)
    }

    // All other hooks are registered as direct pass-through listeners on the shared emitter.
    for (const event of Object.keys(hooks) as Array<keyof KubbHooks & string>) {
      if (event === 'kubb:plugin:setup') continue
      const handler = hooks[event]
      if (!handler) continue

      this.#trackListener(event, handler as HookListener<KubbHooks[typeof event], unknown>)
    }
  }

  /**
   * Emits the `kubb:plugin:setup` event so that all registered hook-style plugin listeners
   * can configure generators, resolvers, macros and renderers before `buildStart` runs.
   *
   * Called once from `run` before the plugin execution loop begins.
   */
  async emitSetupHooks(): Promise<void> {
    const noop = () => {}

    await this.hooks.emit('kubb:plugin:setup', {
      config: this.config,
      options: {},
      addGenerator: noop,
      setResolver: noop,
      addMacro: noop,
      setMacros: noop,
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
   * The renderer comes from `generator.renderer`. Set `generator.renderer = null` (or leave it
   * unset) to opt out of rendering.
   *
   * Call this method inside `addGenerator()` (in `kubb:plugin:setup`) to wire up a generator.
   */
  registerGenerator(pluginName: string, generator: Generator): void {
    const register = <TNode>(event: keyof KubbHooks & string, method: ((node: TNode, ctx: GeneratorContext) => unknown) | undefined): void => {
      if (!method) return

      const handler = async (node: TNode, ctx: GeneratorContext) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await method(node, ctx)
        await this.dispatch({ result, renderer: generator.renderer })
      }

      this.#trackListener(event, handler as HookListener<KubbHooks[typeof event], unknown>)
    }

    register('kubb:generate:schema', generator.schema)
    register('kubb:generate:operation', generator.operation)
    register('kubb:generate:operations', generator.operations)

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
   * Runs the full plugin pipeline. Returns the diagnostics collected so far even
   * when an outer hook throws, since the orchestrator preserves partial state by capturing
   * the failure as a {@link Diagnostic} instead of propagating. Each plugin also
   * contributes a `timing` diagnostic for the run summary.
   */
  async run({ storage }: { storage: Storage }): Promise<{ diagnostics: Array<Diagnostic> }> {
    const { hooks, config } = this
    const diagnostics: Array<Diagnostic> = []
    const parsersMap = new Map<FileNode['extname'], Parser>()

    for (const parser of config.parsers) {
      if (parser.extNames) {
        for (const ext of parser.extNames) parsersMap.set(ext, parser)
      }
    }

    const processor = new FileProcessor({ parsers: parsersMap, storage, extension: config.output.extension })
    // Bridge processor lifecycle to the user-facing kubb hooks so existing listeners on
    // kubb:files:processing:* keep firing.
    processor.hooks.on('start', async (files) => {
      await hooks.emit('kubb:files:processing:start', { files })
    })
    const updateBuffer: Array<{ file: FileNode; source?: string; processed: number; total: number; percentage: number }> = []
    processor.hooks.on('update', (item) => {
      updateBuffer.push(item)
    })
    processor.hooks.on('end', async (files) => {
      await hooks.emit('kubb:files:processing:update', {
        files: updateBuffer.map((item) => ({ ...item, config })),
      })
      updateBuffer.length = 0
      await hooks.emit('kubb:files:processing:end', { files })
    })
    const onFileUpsert = (file: FileNode): void => {
      processor.enqueue(file)
    }
    this.fileManager.hooks.on('upsert', onFileUpsert)

    // Make `diagnostics` the active sink so deep code (adapter parse, lazily consumed
    // streams, generators) can report into this run via `Diagnostics.report`.
    return Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      async () => {
        try {
          const outputRoot = resolve(config.root, config.output.path)

          // Parse the adapter source into the streaming `InputNode`.
          await this.#parseInput()
          // Emit `kubb:plugin:setup` so plugins can register macros via `addMacro`/`setMacros`.
          // Each call writes into `this.#transforms`, which `#runGenerators` later reads through
          // `transforms.applyTo`.
          await this.emitSetupHooks()

          if (this.adapter && this.inputNode) {
            await hooks.emit(
              'kubb:build:start',
              Object.assign({ config, adapter: this.adapter, meta: this.inputNode.meta, getPlugin: this.getPlugin.bind(this) }, this.#filesPayload()),
            )
          }

          const generatorPlugins: Array<{ plugin: NormalizedPlugin; context: Omit<GeneratorContext, 'options'>; hrStart: ReturnType<typeof process.hrtime> }> =
            []

          for (const plugin of this.plugins.values()) {
            const context = this.getContext(plugin)
            const hrStart = process.hrtime()

            try {
              await hooks.emit('kubb:plugin:start', { plugin })
            } catch (caughtError) {
              const error = caughtError as Error
              const duration = getElapsedMs(hrStart)

              await this.#emitPluginEnd({ plugin, duration, success: false, error })

              diagnostics.push({ ...Diagnostics.from(error), plugin: plugin.name }, Diagnostics.performance({ plugin: plugin.name, duration }))

              continue
            }

            if (this.hasEventGenerators(plugin.name)) {
              generatorPlugins.push({ plugin, context, hrStart })

              continue
            }

            const duration = getElapsedMs(hrStart)
            diagnostics.push(Diagnostics.performance({ plugin: plugin.name, duration }))

            await this.#emitPluginEnd({ plugin, duration, success: true })
          }

          // Stream every node through the transform registry and into each plugin's generators.
          // When there are no entries it returns early. When `inputNode` is missing it still
          // closes out each entry's `kubb:plugin:end` directly.
          diagnostics.push(...(await this.#runGenerators(generatorPlugins, () => processor.flush())))
          // Wait for the last in-flight batch and write anything still pending.
          await processor.drain()

          await hooks.emit('kubb:plugins:end', Object.assign({ config }, this.#filesPayload()))

          // Plugins-end listeners (barrel plugin etc.) may have queued more files.
          await processor.drain()

          await hooks.emit('kubb:build:end', { files: this.fileManager.files, config, outputDir: outputRoot })

          return { diagnostics: Diagnostics.dedupe(diagnostics) }
        } catch (caughtError) {
          diagnostics.push(Diagnostics.from(caughtError))
          return { diagnostics: Diagnostics.dedupe(diagnostics) }
        } finally {
          this.fileManager.hooks.off('upsert', onFileUpsert)
        }
      },
    )
  }

  // Returns a fresh object with a lazy `files` getter and a bound `upsertFile`.
  // Caller must use `Object.assign(extra, this.#filesPayload())`, not object spread.
  // Spread would eagerly invoke the getter and freeze a stale snapshot into the payload.
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

  /**
   * Streams schemas and operations through every plugin's generators. Each node is run
   * through the plugin's macros (from `this.#transforms`) before the generator sees it,
   * so plugins stay isolated and the hot path stays per-node. Schemas run before operations
   * because the two passes share `flushPending` and the FileProcessor's event emitter.
   * A failing plugin contributes an error diagnostic so the rest of the build continues.
   * Every plugin also contributes a `timing` diagnostic.
   *
   * Plugins run sequentially so `kubb:plugin:end` fires as each plugin completes, instead
   * of all at once after every plugin has marched through the parallel batches together.
   * That ordering is what drives the CLI's `Plugins N/M` counter. Without it the bar would
   * sit at the initial value until the very end of the run.
   *
   * When `this.inputNode` is `null`, every entry still gets a `kubb:plugin:end` so
   * post-plugin listeners (the barrel writer and friends) complete.
   */
  async #runGenerators(
    entries: Array<{ plugin: NormalizedPlugin; context: Omit<GeneratorContext, 'options'>; hrStart: ReturnType<typeof process.hrtime> }>,
    flushPending: () => Promise<void>,
  ): Promise<Array<Diagnostic>> {
    const diagnostics: Array<Diagnostic> = []

    if (entries.length === 0) return diagnostics

    if (!this.inputNode) {
      for (const { plugin, hrStart } of entries) {
        const duration = getElapsedMs(hrStart)
        diagnostics.push(Diagnostics.performance({ plugin: plugin.name, duration }))
        await this.#emitPluginEnd({ plugin, duration, success: true })
      }
      return diagnostics
    }

    const transforms = this.#transforms
    const { schemas, operations } = this.inputNode

    type PluginState = {
      plugin: NormalizedPlugin
      generatorContext: Omit<GeneratorContext, 'options'>
      generators: Array<Generator>
      hrStart: ReturnType<typeof process.hrtime>
      failed: boolean
      error: Error | null
      optionsAreStatic: boolean
      allowedSchemaNames: Set<string> | null
    }

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
    const emitsOperationsHook = this.hooks.listenerCount('kubb:generate:operations') > 0

    // Buffer the streaming adapter's nodes once. Each plugin reads the same buffer
    // instead of re-parsing the document per pass, and the pruning pre-scan below
    // shares it too (previously it iterated its own copies).
    const schemasBuffer: Array<SchemaNode> = await Array.fromAsync(schemas)
    const operationsBuffer: Array<OperationNode> = await Array.fromAsync(operations)

    // Pre-scan: plugins with operation-based includes (but no schemaName include) need
    // the reachable schema set. This requires the full schema graph in memory at once,
    // since transitive reachability can't be derived from a single node.
    const pruningStates = states.filter(({ plugin }) => {
      const { include } = plugin.options
      return (include?.some(({ type }) => OPERATION_FILTER_TYPES.has(type)) ?? false) && !(include?.some(({ type }) => type === 'schemaName') ?? false)
    })

    if (pruningStates.length > 0) {
      const includedOpsByState = new Map<PluginState, Array<OperationNode>>(pruningStates.map((state) => [state, []]))
      for (const operation of operationsBuffer) {
        for (const state of pruningStates) {
          const { exclude, include, override } = state.plugin.options
          const options = state.generatorContext.resolver.resolveOptions(operation, { options: state.plugin.options, exclude, include, override })
          if (options !== null) includedOpsByState.get(state)?.push(operation)
        }
      }

      for (const state of pruningStates) {
        state.allowedSchemaNames = collectUsedSchemaNames(includedOpsByState.get(state) ?? [], schemasBuffer)
        includedOpsByState.delete(state)
      }
    }

    // Apply the plugin's macros, then resolve options (skipping the resolver when
    // optionsAreStatic). Returns null when include/exclude/override rules out the node.
    // The per-node dispatch and the collected-operations tail both go through this so
    // they agree on what a plugin sees.
    const resolveForPlugin = <TNode extends SchemaNode | OperationNode>(
      state: PluginState,
      node: TNode,
    ): { transformedNode: TNode; options: NormalizedPlugin['options'] } | null => {
      const { plugin, generatorContext } = state
      const transformedNode = transforms.applyTo(plugin.name, node)
      if (state.optionsAreStatic) return { transformedNode, options: plugin.options }

      const { exclude, include, override } = plugin.options
      const options = generatorContext.resolver.resolveOptions(transformedNode, { options: plugin.options, exclude, include, override })
      if (options === null) return null
      return { transformedNode, options }
    }

    // One generation pass: which generator method runs, which kubb:generate hook fires, and
    // whether the schema-only allowedSchemaNames prune applies.
    type NodeDispatch<TNode extends SchemaNode | OperationNode> = {
      method: 'schema' | 'operation'
      checkAllowedNames: boolean
      emit: ((node: TNode, ctx: GeneratorContext) => Promise<void> | void) | null
    }

    // Schemas and operations share this body, differing only in the dispatch descriptor.
    const dispatchNode = async <TNode extends SchemaNode | OperationNode>(state: PluginState, node: TNode, dispatch: NodeDispatch<TNode>): Promise<void> => {
      if (state.failed) return
      try {
        const resolved = resolveForPlugin(state, node)
        if (!resolved) return

        const { transformedNode, options } = resolved
        if (
          dispatch.checkAllowedNames &&
          state.allowedSchemaNames !== null &&
          'name' in transformedNode &&
          transformedNode.name &&
          !state.allowedSchemaNames.has(transformedNode.name)
        ) {
          return
        }

        const ctx = { ...state.generatorContext, options }
        for (const gen of state.generators) {
          const run = gen[dispatch.method] as ((node: TNode, ctx: GeneratorContext) => unknown) | undefined
          if (!run) continue
          const raw = run(transformedNode, ctx)
          const result = isPromise(raw) ? await raw : raw
          const applied = this.dispatch({ result, renderer: gen.renderer })
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

    // Walk nodes in order, flushing queued writes every GENERATE_FLUSH_EVERY nodes so writes
    // reach disk while later nodes are still generating. The generators are synchronous, so
    // batching them through Promise.all never overlapped anything a sequential walk doesn't.
    const dispatchPass = async <TNode extends SchemaNode | OperationNode>(
      state: PluginState,
      nodes: ReadonlyArray<TNode>,
      dispatch: NodeDispatch<TNode>,
    ): Promise<void> => {
      let sinceFlush = 0
      for (const node of nodes) {
        await dispatchNode(state, node, dispatch)
        if (++sinceFlush >= GENERATE_FLUSH_EVERY) {
          sinceFlush = 0
          await flushPending()
        }
      }
      if (sinceFlush > 0) await flushPending()
    }

    for (const state of states) {
      // Only plugins with a gen.operations (or a kubb:generate:operations listener) need the
      // aggregated pass below.
      const needsOperationsAggregate = emitsOperationsHook || state.generators.some((gen) => !!gen.operations)

      // Run schemas before operations: the two passes share the flush and the FileProcessor's
      // event emitter, so interleaving them would race on the shared dirty list.
      await dispatchPass(state, schemasBuffer, schemaDispatch)
      await dispatchPass(state, operationsBuffer, operationDispatch)

      if (!state.failed && needsOperationsAggregate) {
        try {
          const { plugin, generatorContext, generators } = state
          const ctx = { ...generatorContext, options: plugin.options }
          // Match what the per-node dispatch passed to gen.operation(): each operation
          // transformed and filtered by this plugin's excludes/includes/overrides.
          const pluginOperations = operationsBuffer.reduce<Array<OperationNode>>((acc, node) => {
            const resolved = resolveForPlugin(state, node)
            if (resolved) acc.push(resolved.transformedNode)
            return acc
          }, [])
          for (const gen of generators) {
            if (!gen.operations) continue
            const result = await gen.operations(pluginOperations, ctx)
            await this.dispatch({ result, renderer: gen.renderer })
          }
          await this.hooks.emit('kubb:generate:operations', pluginOperations, ctx)
        } catch (caughtError) {
          state.failed = true
          state.error = caughtError as Error
        }
      }

      const duration = getElapsedMs(state.hrStart)
      await this.#emitPluginEnd({ plugin: state.plugin, duration, success: !state.failed, error: state.failed && state.error ? state.error : undefined })

      if (state.failed && state.error) {
        diagnostics.push({ ...Diagnostics.from(state.error), plugin: state.plugin.name })
      }
      diagnostics.push(Diagnostics.performance({ plugin: state.plugin.name, duration }))
    }

    return diagnostics
  }

  /**
   * Stores whatever a generator method or `kubb:generate:*` hook returned.
   *
   * - An `Array<FileNode>` goes straight into `fileManager` via `upsert`.
   * - A renderer element runs through `renderer` (the renderer factory, e.g. JSX) and the
   *   produced files go to `fileManager.upsert`.
   * - A falsy result is treated as a no-op. The generator wrote files itself via
   *   `ctx.upsertFile`.
   *
   * Pass `renderer` when the result may be a renderer element. Generators that only return
   * `Array<FileNode>` do not need one.
   */
  async dispatch<TElement = unknown>({
    result,
    renderer,
  }: {
    result: TElement | Array<FileNode> | undefined | null
    renderer?: RendererFactory<TElement> | null
  }): Promise<void> {
    if (!result) return

    if (Array.isArray(result)) {
      this.fileManager.upsert(...(result as Array<FileNode>))
      return
    }

    if (!renderer) {
      return
    }

    using instance = renderer()
    if (instance.stream) {
      for (const file of instance.stream(result)) {
        this.fileManager.upsert(file)
      }
      return
    }

    await instance.render(result)
    this.fileManager.upsert(...instance.files)
  }

  /**
   * Removes every listener the driver added. Listeners attached directly to `hooks` from outside
   * the driver survive. Called at the end of a build to prevent leaks across repeated builds.
   *
   * @internal
   */
  dispose(): void {
    for (const [event, handler] of this.#listeners) {
      this.hooks.off(event, handler as HookListener<KubbHooks[typeof event]>)
    }
    this.#listeners.length = 0
    this.#eventGeneratorPlugins.clear()
    this.#transforms.dispose()
    // Release resolver closures. The driver is rebuilt for each build() call
    // so there is no value in retaining these maps after disposal.
    this.#resolvers.clear()
    this.#defaultResolvers.clear()
    // Release the FileNode cache and parsed adapter graph so memory is reclaimed
    // between builds. The returned `BuildOutput.files` array still references any
    // FileNodes the caller needs to inspect.
    this.fileManager.dispose()
    this.inputNode = null
    this.#adapterSource = null
  }

  [Symbol.dispose](): void {
    this.dispose()
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

  getContext<TOptions extends PluginFactoryOptions>(plugin: NormalizedPlugin<TOptions>): Omit<GeneratorContext<TOptions>, 'options'> {
    const driver = this

    // Collect into the active build only. The host renders each collected diagnostic once after the
    // build (the CLI via `Diagnostics.emit`, the agent via its post-build loop), so emitting a live
    // `kubb:error`/`kubb:warn`/`kubb:info` here would render it twice.
    const report = (diagnostic: Omit<ProblemDiagnostic, 'plugin'>): void => {
      Diagnostics.report({ ...diagnostic, plugin: plugin.name })
    }

    return {
      config: driver.config,
      get root(): string {
        return resolve(driver.config.root, driver.config.output.path)
      },
      hooks: driver.hooks,
      plugin,
      getPlugin: driver.getPlugin.bind(driver),
      // Close over the owning plugin so a missing dependency error names who required it.
      requirePlugin: ((name: string) => driver.requirePlugin(name, { requiredBy: plugin.name })) as GeneratorContext<TOptions>['requirePlugin'],
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
      get adapter(): Adapter {
        // Generators only read `adapter` during AST hooks, which run after the
        // adapter is set, so it is guaranteed defined at read time.
        return driver.adapter!
      },
      get resolver() {
        return driver.getResolver(plugin.name)
      },
      warn(message: string) {
        report({ code: Diagnostics.code.pluginWarning, severity: 'warning', message })
      },
      error(error: string | Error) {
        const cause = typeof error === 'string' ? undefined : error
        report({ code: Diagnostics.code.pluginFailed, severity: 'error', message: typeof error === 'string' ? error : error.message, cause })
      },
      info(message: string) {
        report({ code: Diagnostics.code.pluginInfo, severity: 'info', message })
      },
    }
  }

  getPlugin<TName extends keyof Kubb.PluginRegistry>(pluginName: TName): Plugin<Kubb.PluginRegistry[TName]> | undefined
  getPlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(pluginName: string): Plugin<TOptions> | undefined
  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName)
  }

  /**
   * Like `getPlugin` but throws a descriptive error when the plugin is not found.
   */
  requirePlugin<TName extends keyof Kubb.PluginRegistry>(pluginName: TName, context?: RequirePluginContext): Plugin<Kubb.PluginRegistry[TName]>
  requirePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(pluginName: string, context?: RequirePluginContext): Plugin<TOptions>
  requirePlugin(pluginName: string, context?: RequirePluginContext): Plugin {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      const requiredBy = context?.requiredBy
      throw new Diagnostics.Error({
        code: Diagnostics.code.pluginNotFound,
        severity: 'error',
        message: requiredBy
          ? `Plugin "${pluginName}" is required by "${requiredBy}" but not found. Make sure it is included in your Kubb config.`
          : `Plugin "${pluginName}" is required but not found. Make sure it is included in your Kubb config.`,
        help: requiredBy
          ? `Add "${pluginName}" to the \`plugins\` array in kubb.config.ts (required by "${requiredBy}"), or remove the dependency on it.`
          : `Add "${pluginName}" to the \`plugins\` array in kubb.config.ts, or remove the dependency on it.`,
        location: { kind: 'config' },
      })
    }
    return plugin
  }
}

function inputToAdapterSource(config: Config): AdapterSource {
  const input = config.input
  if (!input) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.inputRequired,
      severity: 'error',
      message: 'An adapter is configured without an input.',
      help: 'Provide `input.path` (a file or URL) or `input.data` (an inline spec) in your Kubb config.',
      location: { kind: 'config' },
    })
  }

  if ('data' in input) {
    return { type: 'data', data: input.data }
  }

  if (Url.canParse(input.path)) {
    return { type: 'path', path: input.path }
  }

  const resolved = resolve(config.root, input.path)

  return { type: 'path', path: resolved }
}
