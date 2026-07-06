import { resolve } from 'node:path'
import { arrayToAsyncIterable, getElapsedMs, memoize } from '@internals/utils'
import { ast, collectUsedSchemaNames, type Enforce, type FileNode, type InputMeta, type InputNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import { OPERATION_FILTER_TYPES } from './constants.ts'
import { type Diagnostic, Diagnostics, type ProblemDiagnostic } from './Diagnostics.ts'
import type { RendererFactory } from './createRenderer.ts'
import type { Storage } from './createStorage.ts'
import type { Generator } from './defineGenerator.ts'
import type { Parser } from './defineParser.ts'
import type { Plugin } from './definePlugin.ts'
import { normalizeOutput } from './definePlugin.ts'
import type { ResolverOverride } from './createResolver.ts'
import { createResolver, Resolver } from './createResolver.ts'
import { FileManager } from './FileManager.ts'
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
} from './types.ts'
import type { AsyncEventEmitter } from './asyncEventEmitter.ts'

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

const ENFORCE_ORDER = { pre: -1, post: 1 } satisfies Record<Enforce, number>

/**
 * Orders plugins so every dependency runs before its dependents (Kahn's algorithm), with
 * `enforce` (`'pre'` before normal before `'post'`) and declaration order as tiebreaks.
 * A pairwise `Array.sort` comparator cannot do this: dependency relations are not transitive
 * at the comparator level, so a chain where A depends on B and B depends on C could come out
 * wrong when A and C are never compared directly. Dependencies on plugins missing from the
 * config are ignored here and surface later through `requirePlugin`.
 */
function sortPlugins(plugins: Array<NormalizedPlugin>): Array<NormalizedPlugin> {
  const queue = [...plugins].sort((a, b) => (a.enforce ? ENFORCE_ORDER[a.enforce] : 0) - (b.enforce ? ENFORCE_ORDER[b.enforce] : 0))
  const names = new Set(queue.map((plugin) => plugin.name))
  const blockedBy = new Map(queue.map((plugin) => [plugin.name, new Set(plugin.dependencies?.filter((name) => names.has(name) && name !== plugin.name))]))

  const sorted: Array<NormalizedPlugin> = []
  while (queue.length > 0) {
    const index = queue.findIndex((plugin) => blockedBy.get(plugin.name)?.size === 0)
    if (index === -1) {
      throw new Diagnostics.Error({
        code: Diagnostics.code.invalidPluginOptions,
        severity: 'error',
        message: `Plugin dependencies form a cycle: ${queue.map((plugin) => plugin.name).join(' → ')}.`,
        help: 'Remove one of the `dependencies` entries so the plugins can be ordered.',
        location: { kind: 'config' },
      })
    }
    const [plugin] = queue.splice(index, 1)
    if (!plugin) break
    sorted.push(plugin)
    for (const blockers of blockedBy.values()) {
      blockers.delete(plugin.name)
    }
  }
  return sorted
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
    const normalized = sortPlugins(this.config.plugins.map((rawPlugin) => this.#normalizePlugin(rawPlugin as Plugin)))

    for (const plugin of normalized) {
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
   * options. Registering its lifecycle handlers on the `AsyncEventEmitter` is
   * done separately by `#registerPlugin`.
   */
  #normalizePlugin(plugin: Plugin): NormalizedPlugin {
    return {
      name: plugin.name,
      dependencies: plugin.dependencies,
      enforce: plugin.enforce,
      hooks: plugin.hooks,
      options: plugin.options ?? { output: { path: '.', mode: 'directory' }, exclude: [], override: [] },
    } as NormalizedPlugin
  }

  /**
   * Parses the adapter source into `this.inputNode`. Idempotent, so repeated calls from
   * `run` do not re-parse. Adapters with `stream()` are used directly; adapters with only
   * `parse()` get wrapped via `ast.factory.createInput({ stream: true })`, so `inputNode` is
   * always the same `InputNode<true>` shape either way.
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
   * via `addGenerator()` in `kubb:plugin:setup`.
   *
   * Used by the build loop to decide whether to walk the AST and emit generator events
   * for a plugin.
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
    const { hooks, config, fileManager } = this
    const diagnostics: Array<Diagnostic> = []
    const parsersMap = new Map<FileNode['extname'], Parser>()

    for (const parser of config.parsers) {
      if (parser.extNames) {
        for (const ext of parser.extNames) parsersMap.set(ext, parser)
      }
    }

    // Bridge the write batch's lifecycle to the user-facing kubb hooks so existing listeners
    // on kubb:files:processing:* keep firing. Tracked locally (not via #trackListener) since
    // these must come off at the end of this run, not just at driver disposal.
    const onWriteStart = async (files: Array<FileNode>) => {
      await hooks.emit('kubb:files:processing:start', { files })
    }
    const updateBuffer: Array<{ file: FileNode; source?: string; processed: number; total: number; percentage: number }> = []
    const onWriteUpdate = (item: (typeof updateBuffer)[number]) => {
      updateBuffer.push(item)
    }
    const onWriteEnd = async (files: Array<FileNode>) => {
      await hooks.emit('kubb:files:processing:update', {
        files: updateBuffer.map((item) => ({ ...item, config })),
      })
      updateBuffer.length = 0
      await hooks.emit('kubb:files:processing:end', { files })
    }
    fileManager.hooks.on('start', onWriteStart)
    fileManager.hooks.on('update', onWriteUpdate)
    fileManager.hooks.on('end', onWriteEnd)

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

          // Run every node through the transform registry and into each plugin's generators.
          diagnostics.push(...(await this.#runGenerators(generatorPlugins)))

          await hooks.emit('kubb:plugins:end', Object.assign({ config }, this.#filesPayload()))

          // Write every generated file once, after post-processing (barrel etc.) has had its
          // chance to add more. Writing mid-generation measured no faster in practice, so a
          // single pass keeps the pipeline simpler.
          await fileManager.write(fileManager.files, { storage, parsers: parsersMap, extension: config.output.extension })

          await hooks.emit('kubb:build:end', { files: this.fileManager.files, config, outputDir: outputRoot })

          return { diagnostics: Diagnostics.dedupe(diagnostics) }
        } catch (caughtError) {
          diagnostics.push(Diagnostics.from(caughtError))
          return { diagnostics: Diagnostics.dedupe(diagnostics) }
        } finally {
          fileManager.hooks.off('start', onWriteStart)
          fileManager.hooks.off('update', onWriteUpdate)
          fileManager.hooks.off('end', onWriteEnd)
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
   * Runs schemas and operations through every plugin's generators. Each node is run
   * through the plugin's macros (from `this.#transforms`) before the generator sees it,
   * so plugins stay isolated and the hot path stays per-node. Schemas run before operations
   * so file output stays deterministic across runs.
   * A failing plugin contributes an error diagnostic so the rest of the build continues.
   * Every plugin also contributes a `timing` diagnostic.
   *
   * Plugins are processed one at a time, in full, so `kubb:plugin:end` fires as each one
   * completes rather than all at once at the end. That ordering drives the CLI's
   * `Plugins N/M` counter.
   *
   * When `this.inputNode` is `null`, every entry still gets a `kubb:plugin:end` so
   * post-plugin listeners (the barrel writer and friends) complete.
   */
  async #runGenerators(
    entries: Array<{ plugin: NormalizedPlugin; context: Omit<GeneratorContext, 'options'>; hrStart: ReturnType<typeof process.hrtime> }>,
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

    const emitsSchemaHook = this.hooks.listenerCount('kubb:generate:schema') > 0
    const emitsOperationHook = this.hooks.listenerCount('kubb:generate:operation') > 0
    const emitsOperationsHook = this.hooks.listenerCount('kubb:generate:operations') > 0

    // Buffer the streaming adapter's nodes once. Each plugin reads the same buffer
    // instead of re-parsing the document per pass, and the pruning pre-scan below
    // shares it too (previously it iterated its own copies).
    const schemasBuffer: Array<SchemaNode> = await Array.fromAsync(schemas)
    const operationsBuffer: Array<OperationNode> = await Array.fromAsync(operations)

    // Pre-scan: plugins with operation-based includes (but no schemaName include) need
    // the reachable schema set, keyed by plugin name. This requires the full schema graph
    // in memory at once, since transitive reachability can't be derived from a single node.
    const allowedSchemaNamesByPlugin = new Map<string, Set<string>>()
    for (const { plugin } of entries) {
      const { exclude, include, override } = plugin.options
      const needsPruning =
        (include?.some(({ type }) => OPERATION_FILTER_TYPES.has(type)) ?? false) && !(include?.some(({ type }) => type === 'schemaName') ?? false)
      if (!needsPruning) continue

      const resolver = this.getResolver(plugin.name)
      const includedOps = operationsBuffer.filter(
        (operation) => resolver.default.options(operation, { options: plugin.options, exclude, include, override }) !== null,
      )
      allowedSchemaNamesByPlugin.set(plugin.name, collectUsedSchemaNames(includedOps, schemasBuffer))
    }

    for (const { plugin, context, hrStart } of entries) {
      const generatorContext = { ...context, resolver: this.getResolver(plugin.name) }
      const { exclude, include, override } = plugin.options
      const optionsAreStatic = !exclude?.length && !include?.length && !override?.length
      const allowedSchemaNames = allowedSchemaNamesByPlugin.get(plugin.name) ?? null

      let error: Error | null = null

      // Applies the plugin's macros, then resolves options (skipping the resolver when
      // optionsAreStatic). Returns null when include/exclude/override rules out the node.
      // The per-node dispatch and the collected-operations tail both go through this so
      // they agree on what the plugin sees.
      const resolveForPlugin = <TNode extends SchemaNode | OperationNode>(
        node: TNode,
      ): { transformedNode: TNode; options: NormalizedPlugin['options'] } | null => {
        const transformedNode = transforms.applyTo(plugin.name, node)
        if (optionsAreStatic) return { transformedNode, options: plugin.options }

        const options = generatorContext.resolver.default.options<NormalizedPlugin['options']>(transformedNode, {
          options: plugin.options,
          exclude,
          include,
          override,
        })
        if (options === null) return null

        return { transformedNode, options }
      }

      // Schemas before operations, in buffer order, so file output stays deterministic. A
      // caught error stops this plugin but not the others, so its remaining nodes are
      // skipped rather than retried.
      if (emitsSchemaHook) {
        for (const node of schemasBuffer) {
          if (error) break
          try {
            const resolved = resolveForPlugin(node)
            if (!resolved) continue

            const { transformedNode, options } = resolved
            if (allowedSchemaNames !== null && transformedNode.name && !allowedSchemaNames.has(transformedNode.name)) continue

            await this.hooks.emit('kubb:generate:schema', transformedNode, { ...generatorContext, options })
          } catch (caughtError) {
            error = caughtError as Error
          }
        }
      }

      if (emitsOperationHook) {
        for (const node of operationsBuffer) {
          if (error) break
          try {
            const resolved = resolveForPlugin(node)
            if (!resolved) continue

            await this.hooks.emit('kubb:generate:operation', resolved.transformedNode, { ...generatorContext, options: resolved.options })
          } catch (caughtError) {
            error = caughtError as Error
          }
        }
      }

      if (!error && emitsOperationsHook) {
        try {
          const ctx = { ...generatorContext, options: plugin.options }
          // Match what the per-node dispatch emitted on kubb:generate:operation: each operation
          // transformed and filtered by this plugin's excludes/includes/overrides.
          const pluginOperations = operationsBuffer.reduce<Array<OperationNode>>((acc, node) => {
            const resolved = resolveForPlugin(node)
            if (resolved) acc.push(resolved.transformedNode)
            return acc
          }, [])
          await this.hooks.emit('kubb:generate:operations', pluginOperations, ctx)
        } catch (caughtError) {
          error = caughtError as Error
        }
      }

      const duration = getElapsedMs(hrStart)
      await this.#emitPluginEnd({ plugin, duration, success: !error, error: error ?? undefined })

      if (error) {
        diagnostics.push({ ...Diagnostics.from(error), plugin: plugin.name })
      }
      diagnostics.push(Diagnostics.performance({ plugin: plugin.name, duration }))
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

  #getDefaultResolver = memoize(this.#defaultResolvers, (pluginName: string): Resolver => createResolver<PluginFactoryOptions>({ pluginName }))

  /**
   * Merges `partial` with the plugin's default resolver and stores the result.
   * Also mirrors it onto `plugin.resolver` so callers using `getPlugin(name).resolver`
   * get the up-to-date resolver without going through `getResolver()`.
   */
  setPluginResolver(pluginName: string, partial: ResolverOverride): void {
    const defaultResolver = this.#getDefaultResolver(pluginName)
    const merged = Resolver.merge(defaultResolver, partial)
    this.#resolvers.set(pluginName, merged)
    const plugin = this.plugins.get(pluginName)
    if (plugin) {
      plugin.resolver = merged
    }
  }

  /**
   * Returns the resolver for the given plugin.
   *
   * Resolution order: resolver set via `setPluginResolver` → lazily created default
   * resolver (identity name, no path transforms).
   */
  getResolver<TName extends keyof Kubb.PluginRegistry>(pluginName: TName): Kubb.PluginRegistry[TName]['resolver']
  getResolver<TResolver extends Resolver = Resolver>(pluginName: string): TResolver
  getResolver(pluginName: string): Resolver {
    return this.#resolvers.get(pluginName) ?? this.#getDefaultResolver(pluginName)
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

  if (URL.canParse(input.path)) {
    return { type: 'path', path: input.path }
  }

  const resolved = resolve(config.root, input.path)

  return { type: 'path', path: resolved }
}
