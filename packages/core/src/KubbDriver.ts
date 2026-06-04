import { basename, join, relative, resolve } from 'node:path'
import { arrayToAsyncIterable, type AsyncEventEmitter, forBatches, getElapsedMs, isPromise, memoize, URLPath } from '@internals/utils'
import { collectUsedSchemaNames, createFile, createSource, createStreamInput } from '@kubb/ast'
import type { FileNode, InputMeta, InputStreamNode, OperationNode, SchemaNode } from '@kubb/ast'
import { version as coreVersion } from '../package.json'
import { OPERATION_FILTER_TYPES, SCHEMA_PARALLEL } from './constants.ts'
import { Fingerprint } from './Fingerprint.ts'
import { NodeFingerprint } from './NodeFingerprint.ts'
import { type Diagnostic, Diagnostics, type ProblemDiagnostic } from './diagnostics.ts'
import type { NodeManifest, NodeManifestEntry, NodeManifestExport, NodeManifestFile } from './createCache.ts'
import type { RendererFactory } from './createRenderer.ts'
import type { Storage } from './createStorage.ts'
import type { Generator } from './defineGenerator.ts'
import type { Parser } from './defineParser.ts'
import type { Plugin } from './definePlugin.ts'
import { getMode } from './definePlugin.ts'
import { defineResolver } from './defineResolver.ts'
import { FileManager } from './FileManager.ts'
import { FileProcessor } from './FileProcessor.ts'
import { type HookListener, HookRegistry } from './HookRegistry.ts'
import { Transform } from './Transform.ts'

import type {
  Adapter,
  AdapterSource,
  Config,
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

/**
 * Per-node cache state threaded through `#runGenerators` for a partial rebuild. `prev` is the
 * previous run's manifest (or `null` on the first cached run, when everything is regenerated and
 * recorded for next time). The remaining fields accumulate this run's attribution so a fresh
 * manifest can be persisted afterwards.
 */
type PartialContext = {
  prev: NodeManifest | null
  outputRoot: string
  storage: Storage
  /** relPath -> the producers that wrote it; a path with more than one producer is shared. */
  producerByPath: Map<string, Set<string>>
  /** relPath -> barrel export metadata, for files owned by a single node. */
  exportsByPath: Map<string, Array<NodeManifestExport>>
  /** nodeId -> its content key and the relPaths it produced this run (regenerated nodes). */
  regenerated: Map<string, { nodeKey: string; relPaths: Set<string> }>
  /** nodeId -> entry carried forward verbatim (reused nodes). */
  carried: Map<string, NodeManifestEntry>
  /** Every nodeId seen this run, used to prune files of removed nodes. */
  seen: Set<string>
  /** Records a replayed file's source into the whole-build snapshot, keyed by absolute path. */
  recordSource: (absolutePath: string, source: string) => void
}

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
   * Always set after adapter setup, parse-only adapters are wrapped automatically.
   */
  inputNode: InputStreamNode | null = null
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
   * Tracks every listener the driver added (plugin, middleware, generator) so `dispose()` can
   * remove them in one pass. Middleware registers after plugins, so it fires last via `Set`
   * insertion order. External `hooks.on(...)` listeners are not tracked.
   */
  readonly #registry: HookRegistry<KubbHooks>

  /**
   * Transform registry. Plugins populate it during `kubb:plugin:setup` via `setTransformer`,
   * and `#runGenerators` reads it once per `(plugin, node)` pair through `applyTo`.
   */
  readonly #transforms = new Transform()

  /**
   * Placeholder FileNodes upserted when a node's output is replayed from the per-node cache. Their
   * source is written to storage directly, so the FileProcessor must skip them (see `onFileUpsert`).
   */
  readonly #replayedPlaceholders = new WeakSet<FileNode>()

  /**
   * Per-node capture bridge for the partial cache. Keyed by the generator `ctx` object (unique per
   * node, so it is concurrency-safe), it collects the files an event generator upserts so they can
   * be attributed to the node that produced them.
   */
  readonly #captureByCtx = new WeakMap<object, Array<FileNode>>()

  constructor(config: Config, options: Options) {
    this.config = config
    this.options = options
    this.adapter = config.adapter ?? null
    this.#registry = new HookRegistry({ emitter: options.hooks })
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
      this.#adapterSource = inputToAdapterSource(this.config)
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

  /**
   * Parses the adapter source into `this.inputNode`. Idempotent, so repeated calls from
   * `run` do not re-parse. Adapters with `stream()` are used directly.
   * Adapters with only `parse()` are wrapped via `createStreamInput` so the dispatch loop
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
    this.inputNode = createStreamInput(arrayToAsyncIterable(parsed.schemas), arrayToAsyncIterable(parsed.operations), parsed.meta)
  }

  #registerMiddleware<K extends keyof KubbHooks & string>(event: K, middlewareHooks: Middleware['hooks']) {
    const handler = middlewareHooks[event]

    if (!handler) {
      return
    }

    this.#registry.register({ event, handler, source: 'middleware' })
  }

  /**
   * Registers a hook-style plugin's lifecycle handlers on the shared `AsyncEventEmitter`.
   *
   * The `kubb:plugin:setup` listener wraps the global context in a plugin-specific one so
   * `addGenerator`, `setResolver`, and `setTransformer` target the right `normalizedPlugin`.
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
          addGenerator: (gen) => {
            this.registerGenerator(plugin.name, gen)
          },
          setResolver: (resolver) => {
            this.setPluginResolver(plugin.name, resolver)
          },
          setTransformer: (visitor) => {
            this.#transforms.register(plugin.name, visitor)
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

      this.#registry.register({ event: 'kubb:plugin:setup', handler: setupHandler, source: 'plugin' })
    }

    // All other hooks are registered as direct pass-through listeners on the shared emitter.
    for (const event of Object.keys(hooks) as Array<keyof KubbHooks & string>) {
      if (event === 'kubb:plugin:setup') continue
      const handler = hooks[event]
      if (!handler) continue

      this.#registry.register({
        event,
        handler: handler as HookListener<KubbHooks[typeof event], unknown>,
        source: 'plugin',
      })
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
    if (generator.schema) {
      const schemaHandler = async (node: SchemaNode, ctx: GeneratorContext) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await generator.schema!(node, ctx)

        this.#capture(ctx, await this.dispatch({ result, renderer: generator.renderer }))
      }

      this.#registry.register({ event: 'kubb:generate:schema', handler: schemaHandler, source: 'driver' })
    }

    if (generator.operation) {
      const operationHandler = async (node: OperationNode, ctx: GeneratorContext) => {
        if (ctx.plugin.name !== pluginName) return

        const result = await generator.operation!(node, ctx)
        this.#capture(ctx, await this.dispatch({ result, renderer: generator.renderer }))
      }

      this.#registry.register({ event: 'kubb:generate:operation', handler: operationHandler, source: 'driver' })
    }

    if (generator.operations) {
      const operationsHandler = async (nodes: Array<OperationNode>, ctx: GeneratorContext) => {
        if (ctx.plugin.name !== pluginName) return
        const result = await generator.operations!(nodes, ctx)
        this.#capture(ctx, await this.dispatch({ result, renderer: generator.renderer }))
      }

      this.#registry.register({ event: 'kubb:generate:operations', handler: operationsHandler, source: 'driver' })
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

  // Pushes the files an event generator upserted into the active per-node sink, if one is set.
  #capture(ctx: object, files: Array<FileNode>): void {
    if (files.length === 0) return
    this.#captureByCtx.get(ctx)?.push(...files)
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
    // Final rendered source per output path, captured for the cache snapshot on a miss. Barrel
    // files flow through here too, after the second `drain()`.
    const snapshotSources = new Map<string, string>()
    processor.hooks.on('update', (item) => {
      updateBuffer.push(item)
      if (item.source !== undefined) snapshotSources.set(item.file.path, item.source)
    })
    processor.hooks.on('end', async (files) => {
      await hooks.emit('kubb:files:processing:update', {
        files: updateBuffer.map((item) => ({ ...item, config })),
      })
      updateBuffer.length = 0
      await hooks.emit('kubb:files:processing:end', { files })
    })
    const onFileUpsert = (file: FileNode): void => {
      // Replayed placeholders carry no source nodes; their content is written to storage directly,
      // so enqueueing them would render an empty file over the cached one.
      if (this.#replayedPlaceholders.has(file)) return
      processor.enqueue(file)
    }
    this.fileManager.hooks.on('upsert', onFileUpsert)

    // Make `diagnostics` the active sink so deep code (adapter parse, lazily consumed
    // streams, generators) can report into this run via `Diagnostics.report`.
    return Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      async () => {
        try {
          const cache = config.cache
          const outputRoot = resolve(config.root, config.output.path)
          const cacheKey = cache ? await Fingerprint.compute({ config, adapterSource: this.#adapterSource, version: coreVersion }) : null
          const configKey = cache?.restoreManifest && cache?.persistManifest ? Fingerprint.computeConfigKey({ config, version: coreVersion }) : null

          if (cache && cacheKey) {
            const snapshot = await cache.restore({ key: cacheKey })
            if (snapshot) {
              // Cache hit: write the cached sources straight to storage and skip parsing, plugin
              // setup, the generator loop, and the FileProcessor render pass. Only `kubb:build:end`
              // fires, which is what reporters listen for. Skipping all of that is the whole point.
              for (const [relativePath, source] of Object.entries(snapshot.files)) {
                const absolutePath = join(outputRoot, relativePath)
                this.fileManager.upsert(createFile({ path: absolutePath, baseName: basename(relativePath) as `${string}.${string}` }))
                await storage.setItem(absolutePath, source)
              }
              await hooks.emit('kubb:build:end', { files: this.fileManager.files, config, outputDir: outputRoot })
              return { diagnostics: Diagnostics.dedupe(diagnostics) }
            }
          }

          // Parse the adapter source into the streaming `InputNode`.
          await this.#parseInput()
          // Emit `kubb:plugin:setup` so plugins can register transformers via `setTransformer`.
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

          // Build the partial-cache context: fetch the previous run's per-node manifest so unchanged
          // schemas/operations can be replayed instead of regenerated.
          let partial: PartialContext | undefined
          if (cache && configKey && cache.restoreManifest) {
            const prev = await cache.restoreManifest({ configKey })
            partial = {
              prev: prev && prev.version === NodeFingerprint.version ? prev : null,
              outputRoot,
              storage,
              producerByPath: new Map(),
              exportsByPath: new Map(),
              regenerated: new Map(),
              carried: new Map(),
              seen: new Set(),
              recordSource: (absolutePath, source) => snapshotSources.set(absolutePath, source),
            }
          }

          // Stream every node through the transform registry and into each plugin's generators.
          // Handles the empty-entries and missing-`inputNode` cases by closing out each entry's
          // `kubb:plugin:end` directly.
          diagnostics.push(...(await this.#runGenerators(generatorPlugins, () => processor.flush(), partial)))
          // Wait for the last in-flight batch and write anything still pending.
          await processor.drain()

          await hooks.emit('kubb:plugins:end', Object.assign({ config }, this.#filesPayload()))

          // Plugins-end listeners (barrel middleware etc.) may have queued more files.
          await processor.drain()

          await hooks.emit('kubb:build:end', { files: this.fileManager.files, config, outputDir: outputRoot })

          if (cache && cacheKey && !Diagnostics.hasError(diagnostics)) {
            const files: Record<string, string> = {}
            for (const [absolutePath, source] of snapshotSources) {
              files[relative(outputRoot, absolutePath)] = source
            }
            await cache.persist({ key: cacheKey, snapshot: { files } })
          }

          if (cache && configKey && cache.persistManifest && partial && !Diagnostics.hasError(diagnostics)) {
            await cache.persistManifest({ configKey, manifest: this.#buildNodeManifest(partial, snapshotSources) })
          }

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
   * through the plugin's transformer (from `this.#transforms`) before the generator sees it,
   * so plugins stay isolated and the hot path stays per-node. Schemas run before operations
   * because the two passes share `flushPending` and the FileProcessor's event emitter.
   * A failing plugin contributes an error diagnostic so the rest of the build continues.
   * Every plugin also contributes a `timing` diagnostic.
   *
   * Plugins run sequentially so `kubb:plugin:end` fires as each plugin completes, instead
   * of all at once after every plugin has marched through the parallel batches together.
   * That ordering is what drives the CLI's `Plugins N/M` counter; without it the bar would
   * sit at the initial value until the very end of the run.
   *
   * When `entries` is empty or `this.inputNode` is `null`, every entry still gets a
   * `kubb:plugin:end` so middleware listeners (the barrel writer and friends) complete.
   */
  async #runGenerators(
    entries: Array<{ plugin: NormalizedPlugin; context: Omit<GeneratorContext, 'options'>; hrStart: ReturnType<typeof process.hrtime> }>,
    flushPending: () => Promise<void>,
    partial?: PartialContext,
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
    const schemasBuffer: Array<SchemaNode> = []
    for await (const schema of schemas) schemasBuffer.push(schema)
    const operationsBuffer: Array<OperationNode> = []
    for await (const operation of operations) operationsBuffer.push(operation)

    // Named-schema lookup, used by the per-node fingerprint to hash a node's transitive references.
    const schemasByName = new Map<string, SchemaNode>()
    if (partial) {
      for (const schema of schemasBuffer) {
        if (schema.name) schemasByName.set(schema.name, schema)
      }
    }
    let inlineCounter = 0

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

    // Apply the plugin's transformer, then resolve options (skipping the resolver when
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

    // Schema and operation passes share this body. They differ only in which generator
    // method runs, which hook is emitted, and the schema-only `allowedSchemaNames` prune
    // (operations don't carry that constraint).
    const dispatchNode = async <TNode extends SchemaNode | OperationNode>(
      state: PluginState,
      node: TNode,
      dispatch: {
        method: 'schema' | 'operation'
        checkAllowedNames: boolean
        emit: ((node: TNode, ctx: GeneratorContext) => Promise<void> | void) | null
      },
    ): Promise<Array<FileNode>> => {
      if (state.failed) return []
      const produced: Array<FileNode> = []
      try {
        const resolved = resolveForPlugin(state, node)
        if (!resolved) return produced

        const { transformedNode, options } = resolved
        if (
          dispatch.checkAllowedNames &&
          state.allowedSchemaNames !== null &&
          'name' in transformedNode &&
          transformedNode.name &&
          !state.allowedSchemaNames.has(transformedNode.name)
        ) {
          return produced
        }

        const ctx = { ...state.generatorContext, options }
        // Collect files from event generators (which run inside the `kubb:generate:*` handlers) for
        // this node only; the ctx object is unique per node, so concurrent batches don't mix.
        if (partial) this.#captureByCtx.set(ctx, produced)
        try {
          for (const gen of state.generators) {
            const run = gen[dispatch.method] as ((node: TNode, ctx: GeneratorContext) => unknown) | undefined
            if (!run) continue
            const raw = run(transformedNode, ctx)
            const result = isPromise(raw) ? await raw : raw
            produced.push(...(await this.dispatch({ result, renderer: gen.renderer })))
          }
          if (dispatch.emit) await dispatch.emit(transformedNode, ctx)
        } finally {
          if (partial) this.#captureByCtx.delete(ctx)
        }
      } catch (caughtError) {
        state.failed = true
        state.error = caughtError as Error
      }
      return produced
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

    const extractExports = (file: FileNode): Array<NodeManifestExport> =>
      (file.sources ?? []).map((source) => ({ name: source.name ?? null, isIndexable: source.isIndexable ?? false, isTypeOnly: source.isTypeOnly ?? false }))

    const nodeKeyOf = (
      state: PluginState,
      kind: 'schema' | 'operation',
      resolved: { transformedNode: SchemaNode | OperationNode; options: NormalizedPlugin['options'] },
    ): { nodeId: string | null; nodeKey: string | null } => {
      const pluginName = state.plugin.name
      if (kind === 'schema') {
        const node = resolved.transformedNode as SchemaNode
        const nodeId = NodeFingerprint.schemaNodeId({ pluginName, name: node.name })
        if (!nodeId) return { nodeId: null, nodeKey: null }
        return { nodeId, nodeKey: NodeFingerprint.schemaNodeKey({ pluginName, nodeId, resolvedOptions: resolved.options, node, schemasByName }) }
      }
      const node = resolved.transformedNode as OperationNode
      const nodeId = NodeFingerprint.operationNodeId({ pluginName, operationId: node.operationId })
      return { nodeId, nodeKey: NodeFingerprint.operationNodeKey({ pluginName, nodeId, resolvedOptions: resolved.options, node, schemasByName }) }
    }

    // Attribute a regenerated node's files: tag each path's producer (so shared paths are detected)
    // and remember the node's content key for the next manifest. Inline schemas (no nodeId) get a
    // unique producer token so they never look exclusive.
    const recordRegen = (state: PluginState, nodeId: string | null, nodeKey: string | null, produced: Array<FileNode>): void => {
      if (!partial) return
      const producer = nodeId ?? `inline:${state.plugin.name}:${inlineCounter++}`
      for (const file of produced) {
        const rel = relative(partial.outputRoot, file.path)
        const set = partial.producerByPath.get(rel) ?? new Set<string>()
        set.add(producer)
        partial.producerByPath.set(rel, set)
        partial.exportsByPath.set(rel, extractExports(file))
        if (nodeId && nodeKey) {
          const entry = partial.regenerated.get(nodeId) ?? { nodeKey, relPaths: new Set<string>() }
          entry.relPaths.add(rel)
          partial.regenerated.set(nodeId, entry)
        }
      }
      if (nodeId) partial.seen.add(nodeId)
    }

    // Run one kind (schemas or operations) for a plugin. Without a cache this is the plain batched
    // dispatch. With a cache it partitions into reusable (replay) and changed (regenerate) nodes,
    // regenerates first (phase A), then replays the still-exclusive ones (phase B).
    const runKind = async <TNode extends SchemaNode | OperationNode>(
      state: PluginState,
      nodes: Array<TNode>,
      dispatch: { method: 'schema' | 'operation'; checkAllowedNames: boolean; emit: ((node: TNode, ctx: GeneratorContext) => Promise<void> | void) | null },
      kind: 'schema' | 'operation',
    ): Promise<void> => {
      if (!partial) {
        await forBatches(nodes, (batch) => Promise.all(batch.map((node) => dispatchNode(state, node, dispatch))), {
          concurrency: SCHEMA_PARALLEL,
          flush: flushPending,
        })
        return
      }

      const reuse: Array<{ node: TNode; nodeId: string; entry: NodeManifestEntry }> = []
      const regen: Array<{ node: TNode; nodeId: string | null; nodeKey: string | null }> = []
      for (const node of nodes) {
        const resolved = resolveForPlugin(state, node)
        if (!resolved) continue
        if (
          kind === 'schema' &&
          state.allowedSchemaNames !== null &&
          'name' in resolved.transformedNode &&
          resolved.transformedNode.name &&
          !state.allowedSchemaNames.has(resolved.transformedNode.name)
        ) {
          continue
        }
        const { nodeId, nodeKey } = nodeKeyOf(state, kind, resolved)
        const prevEntry = nodeId && partial.prev ? partial.prev.nodes[nodeId] : undefined
        const reusable = !!(
          nodeId &&
          nodeKey &&
          prevEntry &&
          prevEntry.nodeKey === nodeKey &&
          prevEntry.files.every((file) => !partial.prev!.shared.includes(file.relPath))
        )
        if (reusable) {
          reuse.push({ node, nodeId: nodeId!, entry: prevEntry! })
        } else {
          regen.push({ node, nodeId, nodeKey })
        }
      }

      await forBatches(
        regen,
        (batch) =>
          Promise.all(
            batch.map(async ({ node, nodeId, nodeKey }) => {
              const produced = await dispatchNode(state, node, dispatch)
              recordRegen(state, nodeId, nodeKey, produced)
            }),
          ),
        { concurrency: SCHEMA_PARALLEL, flush: flushPending },
      )

      for (const { node, nodeId, entry } of reuse) {
        if (state.failed) break
        const collides = entry.files.some((file) => partial.producerByPath.has(file.relPath))
        if (collides) {
          const resolved = resolveForPlugin(state, node)
          const nodeKey = resolved ? nodeKeyOf(state, kind, resolved).nodeKey : null
          recordRegen(state, nodeId, nodeKey, await dispatchNode(state, node, dispatch))
          continue
        }
        await this.#replayNode({ entry, nodeId, partial })
      }
    }

    for (const state of states) {
      // Skip building the aggregated operations array when this plugin doesn't consume it.
      // Saves an N-sized allocation when the plugin only defines per-node `gen.operation`.
      const needsCollectedOperations = emitsOperationsHook || state.generators.some((gen) => !!gen.operations)

      // Run schemas before operations: the two passes share `flushPending` and the
      // FileProcessor's event emitter, so running them concurrently would interleave
      // `kubb:files:processing:start|end` events and race on the shared dirty list.
      await runKind(state, schemasBuffer, schemaDispatch, 'schema')

      await runKind(state, operationsBuffer, operationDispatch, 'operation')

      if (!state.failed && needsCollectedOperations) {
        try {
          const { plugin, generatorContext, generators } = state
          const ctx = { ...generatorContext, options: plugin.options }
          // Match what the per-node dispatch passes to gen.operation(): the transformed node,
          // already filtered by excludes/includes/overrides. The aggregate sees every operation,
          // reused or regenerated, and its output is always treated as shared (never per-node cached).
          const pluginOperations = operationsBuffer.reduce<Array<OperationNode>>((acc, node) => {
            const resolved = resolveForPlugin(state, node)
            if (resolved) acc.push(resolved.transformedNode)
            return acc
          }, [])
          // The aggregate's files (static or event-driven) span many operations, so mark every path
          // it touches as shared: it is never replayed from a single node.
          const aggregateProduced: Array<FileNode> = []
          if (partial) this.#captureByCtx.set(ctx, aggregateProduced)
          try {
            for (const gen of generators) {
              if (!gen.operations) continue
              const result = await gen.operations(pluginOperations, ctx)
              aggregateProduced.push(...(await this.dispatch({ result, renderer: gen.renderer })))
            }
            await this.hooks.emit('kubb:generate:operations', pluginOperations, ctx)
          } finally {
            if (partial) this.#captureByCtx.delete(ctx)
          }
          if (partial) {
            for (const file of aggregateProduced) {
              const rel = relative(partial.outputRoot, file.path)
              const set = partial.producerByPath.get(rel) ?? new Set<string>()
              set.add('__aggregate__')
              partial.producerByPath.set(rel, set)
            }
          }
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

    // Prune files of nodes that existed last run but are gone now (removed or renamed), unless the
    // same path was produced again this run.
    if (partial?.prev && !Diagnostics.hasError(diagnostics)) {
      for (const [nodeId, entry] of Object.entries(partial.prev.nodes)) {
        if (partial.seen.has(nodeId)) continue
        for (const file of entry.files) {
          if (partial.producerByPath.has(file.relPath)) continue
          await partial.storage.removeItem(join(partial.outputRoot, file.relPath))
        }
      }
    }

    return diagnostics
  }

  /**
   * Replays one node's cached output: writes each file's source straight to storage and upserts a
   * barrel-only placeholder (no source nodes) so middleware still sees the file. The placeholder is
   * flagged so the FileProcessor skips it, and the source is also recorded for the whole-build
   * snapshot so a later full hit stays complete.
   */
  async #replayNode({ entry, nodeId, partial }: { entry: NodeManifestEntry; nodeId: string; partial: PartialContext }): Promise<void> {
    for (const file of entry.files) {
      const absolutePath = join(partial.outputRoot, file.relPath)
      await partial.storage.setItem(absolutePath, file.source)
      partial.recordSource(absolutePath, file.source)
      const placeholder = createFile({
        path: absolutePath,
        baseName: basename(file.relPath) as `${string}.${string}`,
        sources: file.exports.map((source) => createSource({ name: source.name, isIndexable: source.isIndexable, isTypeOnly: source.isTypeOnly, nodes: [] })),
      })
      this.#replayedPlaceholders.add(placeholder)
      this.fileManager.upsert(placeholder)
      const set = partial.producerByPath.get(file.relPath) ?? new Set<string>()
      set.add(nodeId)
      partial.producerByPath.set(file.relPath, set)
    }
    partial.carried.set(nodeId, entry)
    partial.seen.add(nodeId)
  }

  /**
   * Builds the manifest to persist after a partial-aware run: reused nodes carry forward verbatim,
   * regenerated nodes keep only the files they own exclusively, and every multi-producer path is
   * recorded as `shared` so it is never replayed from a single node next time.
   */
  #buildNodeManifest(partial: PartialContext, snapshotSources: Map<string, string>): NodeManifest {
    const shared: Array<string> = []
    for (const [relPath, producers] of partial.producerByPath) {
      if (producers.size > 1 || producers.has('__aggregate__')) shared.push(relPath)
    }
    const sharedSet = new Set(shared)

    const nodes: Record<string, NodeManifestEntry> = {}
    for (const [nodeId, entry] of partial.carried) {
      nodes[nodeId] = entry
    }
    for (const [nodeId, info] of partial.regenerated) {
      const files: Array<NodeManifestFile> = []
      for (const relPath of info.relPaths) {
        if (sharedSet.has(relPath)) continue
        const producers = partial.producerByPath.get(relPath)
        if (!producers || producers.size !== 1 || !producers.has(nodeId)) continue
        const source = snapshotSources.get(join(partial.outputRoot, relPath))
        if (source === undefined) continue
        files.push({ relPath, source, exports: partial.exportsByPath.get(relPath) ?? [] })
      }
      if (files.length) nodes[nodeId] = { nodeKey: info.nodeKey, files }
    }

    return { version: NodeFingerprint.version, nodes, shared }
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
  }): Promise<Array<FileNode>> {
    if (!result) return []

    if (Array.isArray(result)) {
      return this.fileManager.upsert(...(result as Array<FileNode>))
    }

    if (!renderer) {
      return []
    }

    using instance = renderer()
    if (instance.stream) {
      const upserted: Array<FileNode> = []
      for (const file of instance.stream(result)) {
        upserted.push(...this.fileManager.upsert(file))
      }
      return upserted
    }

    await instance.render(result)
    return this.fileManager.upsert(...instance.files)
  }

  /**
   * Removes every listener the driver added. Listeners attached directly to `hooks` from outside
   * the driver survive. Called at the end of a build to prevent leaks across repeated builds.
   *
   * @internal
   */
  dispose(): void {
    this.#registry.dispose()
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
      get adapter(): Adapter {
        // Generators only read `adapter` during AST hooks, which run after the
        // adapter is set, so it is guaranteed defined at read time.
        return driver.adapter!
      },
      get resolver() {
        return driver.getResolver(plugin.name)
      },
      get transformer() {
        return driver.#transforms.get(plugin.name)
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
  requirePlugin<TName extends keyof Kubb.PluginRegistry>(pluginName: TName): Plugin<Kubb.PluginRegistry[TName]>
  requirePlugin<TOptions extends PluginFactoryOptions = PluginFactoryOptions>(pluginName: string): Plugin<TOptions>
  requirePlugin(pluginName: string): Plugin {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.pluginNotFound,
        severity: 'error',
        message: `Plugin "${pluginName}" is required but not found. Make sure it is included in your Kubb config.`,
        help: `Add "${pluginName}" to the \`plugins\` array in kubb.config.ts, or remove the dependency on it.`,
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

  if (new URLPath(input.path).isURL) {
    return { type: 'path', path: input.path }
  }

  const resolved = resolve(config.root, input.path)

  return { type: 'path', path: resolved }
}
