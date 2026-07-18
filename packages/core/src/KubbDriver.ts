import { resolve } from 'node:path'
import { getElapsedMs, toError } from '@internals/utils'
import { ast, collectUsedSchemaNames, type Enforce, type FileNode, type InputMeta, type InputNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import { OPERATION_FILTER_TYPES } from './constants.ts'
import { type Diagnostic, Diagnostics, type ProblemDiagnostic } from './Diagnostics.ts'
import type { RendererFactory } from './createRenderer.ts'
import type { Generator } from './defineGenerator.ts'
import type { Parser } from './defineParser.ts'
import type { Plugin, PluginName, ResolvePluginOptions } from './definePlugin.ts'
import { normalizeOutput } from './definePlugin.ts'
import { createResolver } from './createResolver.ts'
import { Resolver, type ResolverPatch } from './Resolver.ts'
import { FileManager } from './FileManager.ts'
import { Transform } from './Transform.ts'
import { createNodeCache } from './nodeCache.ts'
import { inputToAdapterSource } from './input.ts'

import type { Adapter, AdapterSource, Config, GeneratorContext, Group, KubbHooks, NormalizedPlugin, PluginFactoryOptions } from './types.ts'
import type { Hookable } from './Hookable.ts'

type Options = {
  hooks: Hookable<KubbHooks>
}

type RequirePluginContext = {
  /**
   * Name of the plugin that declared the dependency, included in the error so users can
   * trace which plugin needs the missing one.
   */
  requiredBy?: string
}

const ENFORCE_ORDER = { pre: -1, post: 1 } satisfies Record<Enforce, number>

const enforceWeight = (plugin: NormalizedPlugin): number => (plugin.enforce ? ENFORCE_ORDER[plugin.enforce] : 0)

/**
 * The options bag a `NormalizedPlugin` starts with before a plugin refines it: a directory output
 * at the plugin root and empty filter lists.
 */
function defaultPluginOptions(): NormalizedPlugin['options'] {
  const options: NormalizedPlugin['options'] = { output: { path: '.', mode: 'directory' }, exclude: [], override: [] }
  return options
}

/**
 * Fills in the `output`, `exclude`, and `override` a `NormalizedPlugin` needs from a plugin's raw
 * options, running `output` through `normalizeOutput`. Idempotent, so the driver can apply it after
 * `setOptions` has already run without disturbing an already-normalized bag.
 */
function normalizePluginOptions(rawOptions: Plugin['options'], pluginName: string): NormalizedPlugin['options'] {
  const options: NormalizedPlugin['options'] = { ...defaultPluginOptions(), ...(rawOptions ?? {}) }
  const group = 'group' in options ? (options.group as Group | null | undefined) : undefined
  options.output = normalizeOutput({ output: options.output, group, pluginName })
  return options
}

export class KubbDriver {
  readonly config: Config
  readonly options: Options

  /**
   * The `InputNode` produced by the adapter. Set after adapter setup.
   */
  inputNode: InputNode | null = null
  adapter: Adapter | null = null
  /**
   * Raw adapter source so `adapter.parse()` can run lazily.
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
   * Removers for every listener the driver added (plugin, generator) so `dispose()` can detach
   * them in one pass. External `hooks.hook(...)` listeners are not tracked.
   */
  readonly #unhooks: Array<() => void> = []

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
   * Normalizes every configured plugin, orders them, and registers their lifecycle handlers.
   * A plugin that another lists as a dependency runs first, then `enforce: 'pre'` before
   * `'post'`. When the config has an adapter, the adapter source is resolved from the input
   * so `run` can parse it later.
   */
  async setup() {
    const normalized = this.#sortPlugins(
      this.config.plugins.map((rawPlugin) => {
        const normalizedPlugin: NormalizedPlugin = {
          name: rawPlugin.name,
          dependencies: rawPlugin.dependencies,
          enforce: rawPlugin.enforce,
          hooks: rawPlugin.hooks,
          // `rawPlugin.options` is the user-supplied shape. The normalized `output`/`exclude`/`override`
          // bag is filled in by the post-setup `normalizePluginOptions` pass, after `setOptions` runs.
          options: (rawPlugin.options ?? defaultPluginOptions()) as NormalizedPlugin['options'],
          resolver: createResolver<PluginFactoryOptions>({ pluginName: rawPlugin.name }),
        }
        return normalizedPlugin
      }),
    )

    for (const plugin of normalized) {
      this.#registerPlugin(plugin)
      this.plugins.set(plugin.name, plugin)
    }

    if (this.config.adapter) {
      this.#adapterSource = inputToAdapterSource(this.config)
    }
  }

  /**
   * Orders plugins so every dependency runs before its dependents (Kahn's algorithm), with
   * `enforce` (`'pre'` before normal before `'post'`) and declaration order as tiebreaks.
   * A pairwise `Array.sort` comparator cannot do this: dependency relations are not transitive
   * at the comparator level, so a chain where A depends on B and B depends on C could come out
   * wrong when A and C are never compared directly. Dependencies on plugins missing from the
   * config are ignored here and surface later through `requirePlugin`.
   */
  #sortPlugins(plugins: Array<NormalizedPlugin>): Array<NormalizedPlugin> {
    const queue = [...plugins].sort((a, b) => enforceWeight(a) - enforceWeight(b))
    const names = new Set(queue.map((plugin) => plugin.name))
    const blockedBy = new Map(queue.map((plugin) => [plugin.name, new Set(plugin.dependencies?.filter((name) => names.has(name) && name !== plugin.name))]))

    // One plugin leaves `queue` per pass, so iterating once per plugin drains it. Each pass takes
    // the lowest-index plugin with no remaining blockers, preserving enforce and declaration order.
    const sorted: Array<NormalizedPlugin> = []
    for (const _ of plugins) {
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
      for (const blockers of blockedBy.values()) blockers.delete(plugin.name)
    }

    return sorted
  }

  get hooks() {
    return this.options.hooks
  }

  /**
   * Parses the adapter source into `this.inputNode`. Idempotent, so repeated calls from
   * `run` do not re-parse.
   */
  async #parseInput(): Promise<void> {
    if (this.inputNode || !this.adapter || !this.#adapterSource) return

    this.inputNode = await this.adapter.parse(this.#adapterSource)
  }

  /**
   * Registers a plugin's lifecycle hooks on the shared `Hookable` as pass-through listeners that
   * external tooling can observe via `hooks.hook(...)`. The returned remover is tracked for
   * `dispose`. `kubb:plugin:setup` is skipped here; `setupHooks` invokes it directly with a
   * plugin-scoped context.
   *
   * @internal
   */
  #registerPlugin(plugin: NormalizedPlugin): void {
    const { hooks } = plugin

    if (!hooks) return

    const { 'kubb:plugin:setup': _setup, ...configHooks } = hooks

    this.#unhooks.push(this.hooks.addHooks(configHooks))
  }

  /**
   * Runs each plugin's `kubb:plugin:setup` handler, in plugin order, with a context scoped to that
   * plugin so `addGenerator`, `setResolver`, `addMacro`, `setMacros`, and `setOptions` target its
   * `NormalizedPlugin` entry. Called once from `run` before the plugin execution loop begins, so
   * plugins can configure generators, resolvers, macros, and options before `buildStart`.
   */
  async setupHooks(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      const setup = plugin.hooks?.['kubb:plugin:setup']
      if (!setup) continue

      await setup({
        config: this.config,
        options: plugin.options ?? {},
        addGenerator: (...generators) => {
          for (const generator of generators) {
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
      })
    }
  }

  /**
   * Appends a generator to its owning plugin so the generate loop can call it directly.
   *
   * The generator's `schema`, `operation`, and `operations` methods run per node during the AST
   * walk in `#runGenerators`, and their result is routed through `dispatch`. Because a generator is
   * bound to a plugin, generators from different plugins never cross-fire without a name check. The
   * renderer comes from `generator.renderer`; set it to `null` (or leave it unset) to opt out of
   * rendering.
   *
   * Call this method inside `addGenerator()` (in `kubb:plugin:setup`) to wire up a generator.
   */
  registerGenerator(pluginName: string, generator: Generator): void {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) return

    plugin.generators = plugin.generators ? [...plugin.generators, generator] : [generator]
  }

  /**
   * Returns `true` when at least one generator was registered for the given plugin
   * via `addGenerator()` in `kubb:plugin:setup`.
   *
   * Used by the build loop to decide whether to walk the AST and run the generators
   * for a plugin.
   */
  hasHookGenerators(pluginName: string): boolean {
    return (this.plugins.get(pluginName)?.generators?.length ?? 0) > 0
  }

  /**
   * Runs the full plugin pipeline. Returns the diagnostics collected so far even
   * when an outer hook throws, since the orchestrator preserves partial state by capturing
   * the failure as a {@link Diagnostic} instead of propagating. Each plugin also
   * contributes a `timing` diagnostic for the run summary.
   */
  async run(): Promise<{ diagnostics: Array<Diagnostic> }> {
    const { hooks, config, fileManager } = this
    const diagnostics: Array<Diagnostic> = []
    const updateBuffer: Array<{ file: FileNode; source?: string; processed: number; total: number; percentage: number }> = []
    const parsersMap = new Map<FileNode['extname'], Parser>()

    for (const parser of config.parsers) {
      if (parser.extNames) {
        for (const ext of parser.extNames) parsersMap.set(ext, parser)
      }
    }

    const unhookWrites = fileManager.hooks.addHooks({
      start: async (files) => {
        await hooks.callHook('kubb:files:processing:start', { files })
      },
      update: (item) => {
        updateBuffer.push(item)
      },
      end: async (files: Array<FileNode>) => {
        // Files parse concurrently, so the buffer arrives in completion order. `processed` is each
        // file's input position, so sorting by it restores generation order for the streamed rows.
        updateBuffer.sort((a, b) => a.processed - b.processed)

        await hooks.callHook('kubb:files:processing:update', {
          files: updateBuffer.map((item) => ({ ...item, config })),
        })
        updateBuffer.length = 0
        await hooks.callHook('kubb:files:processing:end', { files })
      },
    })

    // Make `diagnostics` the active sink so deep code (adapter parse, generators) can
    // report into this run via `Diagnostics.report`.
    return Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      async () => {
        try {
          const outputRoot = resolve(config.root, config.output.path)

          // Parse the adapter source into `this.inputNode`.
          await this.#parseInput()
          // Emit `kubb:plugin:setup` so plugins can register macros via `addMacro`/`setMacros`.
          // Each call writes into `this.#transforms`, which `#runGenerators` later reads through
          // `transforms.applyTo`.
          await this.setupHooks()

          // Normalize each plugin's options once setup hooks have run, so the generate loop always
          // sees a filled-in bag whether or not the plugin called `setOptions`.
          for (const plugin of this.plugins.values()) {
            plugin.options = normalizePluginOptions(plugin.options, plugin.name)
          }

          if (this.adapter && this.inputNode) {
            const buildStartContext = this.#withFiles({ config, adapter: this.adapter, meta: this.inputNode.meta, getPlugin: this.getPlugin.bind(this) })
            await hooks.callHook('kubb:build:start', buildStartContext)
          }

          const generatorPlugins: Array<{
            plugin: NormalizedPlugin
            context: Omit<GeneratorContext, 'options' | 'cache'>
            hrStart: ReturnType<typeof process.hrtime>
          }> = []

          for (const plugin of this.plugins.values()) {
            const context = this.getContext(plugin)
            const hrStart = process.hrtime()

            try {
              await hooks.callHook('kubb:plugin:start', { plugin })
            } catch (caughtError) {
              const error = toError(caughtError)
              const duration = getElapsedMs(hrStart)

              await this.#emitPluginEnd({ plugin, duration, success: false, error })

              diagnostics.push({ ...Diagnostics.from(error), plugin: plugin.name }, Diagnostics.performance({ plugin: plugin.name, duration }))

              continue
            }

            if (this.hasHookGenerators(plugin.name)) {
              generatorPlugins.push({ plugin, context, hrStart })

              continue
            }

            const duration = getElapsedMs(hrStart)
            diagnostics.push(Diagnostics.performance({ plugin: plugin.name, duration }))

            await this.#emitPluginEnd({ plugin, duration, success: true })
          }

          // Run every node through the transform registry and into each plugin's generators.
          diagnostics.push(...(await this.#runGenerators(generatorPlugins)))

          await hooks.callHook('kubb:plugins:end', this.#withFiles({ config }))

          // Write every generated file once, after post-processing (barrel etc.) has had its
          // chance to add more. Writing mid-generation measured no faster in practice, so a
          // single pass keeps the pipeline simpler.
          await fileManager.write(fileManager.files, { storage: config.storage, parsers: parsersMap })

          await hooks.callHook('kubb:build:end', { files: this.fileManager.files, config, outputDir: outputRoot })

          return { diagnostics: Diagnostics.dedupe(diagnostics) }
        } catch (caughtError) {
          diagnostics.push(Diagnostics.from(caughtError))
          return { diagnostics: Diagnostics.dedupe(diagnostics) }
        } finally {
          unhookWrites()
        }
      },
    )
  }

  /**
   * Widens `extra` with the files present at emit time and a bound `upsertFile`, the shape every
   * file-carrying hook context shares. Building it here in one place keeps the `files` and
   * `upsertFile` keys from being dropped by a stray spread at the call site.
   */
  #withFiles<T extends object>(extra: T): T & { files: Array<FileNode>; upsertFile: (...files: Array<FileNode>) => Array<FileNode> } {
    return {
      ...extra,
      files: this.fileManager.files,
      upsertFile: (...files: Array<FileNode>) => this.fileManager.upsert(...files),
    }
  }

  #emitPluginEnd({ plugin, duration, success, error }: { plugin: NormalizedPlugin; duration: number; success: boolean; error?: Error }): Promise<void> | void {
    return this.hooks.callHook('kubb:plugin:end', this.#withFiles({ plugin, duration, success, ...(error ? { error } : {}), config: this.config }))
  }

  /**
   * Runs schemas and operations through every plugin's generators. The walk is node-outer: each
   * schema is visited once and each operation once, and the node fans out to the matching
   * generators of every plugin in dependency order. A per-node cache (`createNodeCache`) is created
   * once per node and shared by all of that node's plugins, so node-derived work is computed once
   * and reused instead of recomputed per plugin. Each node still runs through the plugin's macros
   * (from `this.#transforms`) and its exclude/include/override filters before that plugin's
   * generator sees it, so plugins stay isolated. Schemas run before operations so file output
   * stays deterministic across runs.
   *
   * A failing plugin is dropped from the remaining walk, contributes an error diagnostic, and no
   * longer aborts the other plugins. `kubb:plugin:end` and each plugin's `timing` diagnostic fire
   * in dependency order once the walk finishes, driving the CLI's `Plugins N/M` counter. The
   * `operations` batch fires once per plugin after the single operation walk.
   *
   * When `this.inputNode` is `null`, every entry still gets a `kubb:plugin:end` so
   * post-plugin listeners (the barrel writer and friends) complete.
   */
  async #runGenerators(
    entries: Array<{ plugin: NormalizedPlugin; context: Omit<GeneratorContext, 'options' | 'cache'>; hrStart: ReturnType<typeof process.hrtime> }>,
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
      const includedOps = operations.filter(
        (operation) => resolver.default.options(operation, { options: plugin.options, exclude, include, override }) !== null,
      )
      allowedSchemaNamesByPlugin.set(plugin.name, collectUsedSchemaNames(includedOps, schemas))
    }

    // Freeze each plugin's per-run state once so the node-outer walk stays cheap. A plugin's
    // `error` drops it from every remaining node without touching the others.
    const states = entries.map(({ plugin, context, hrStart }) => {
      const generatorContext = { ...context, resolver: this.getResolver(plugin.name) }
      const { exclude, include, override } = plugin.options
      const generators = plugin.generators ?? []
      return {
        plugin,
        hrStart,
        generatorContext,
        exclude,
        include,
        override,
        optionsAreStatic: !exclude?.length && !include?.length && !override?.length,
        allowedSchemaNames: allowedSchemaNamesByPlugin.get(plugin.name) ?? null,
        schemaGenerators: generators.filter((generator) => generator.schema),
        operationGenerators: generators.filter((generator) => generator.operation),
        operationsGenerators: generators.filter((generator) => generator.operations),
        pluginOperations: [] as Array<OperationNode>,
        error: null as Error | null,
      }
    })

    type PluginState = (typeof states)[number]

    // Applies the plugin's macros, then resolves options (skipping the resolver when
    // optionsAreStatic). Returns null when include/exclude/override rules out the node. The
    // per-node dispatch and the collected-operations batch both go through this so they agree on
    // what the plugin sees.
    const resolveForPlugin = <TNode extends SchemaNode | OperationNode>(
      state: PluginState,
      node: TNode,
    ): { transformedNode: TNode; options: NormalizedPlugin['options'] } | null => {
      const transformedNode = transforms.applyTo(state.plugin.name, node)
      if (state.optionsAreStatic) return { transformedNode, options: state.plugin.options }

      const options = state.generatorContext.resolver.default.options<NormalizedPlugin['options']>(transformedNode, {
        options: state.plugin.options,
        exclude: state.exclude,
        include: state.include,
        override: state.override,
      })
      if (options === null) return null

      return { transformedNode, options }
    }

    // Schemas before operations, in adapter order, so file output stays deterministic. For each
    // node the plugins fan out in dependency order and share one cache. A caught error drops that
    // plugin from the rest of the walk but not the others, so its remaining nodes are skipped
    // rather than retried. Generators run directly; `kubb:generate:*` still fires for observers.
    for (const node of schemas) {
      const cache = createNodeCache()
      for (const state of states) {
        if (state.error || !state.schemaGenerators.length) continue
        try {
          const resolved = resolveForPlugin(state, node)
          if (!resolved) continue

          const { transformedNode, options } = resolved
          if (state.allowedSchemaNames !== null && transformedNode.name && !state.allowedSchemaNames.has(transformedNode.name)) continue

          const ctx = { ...state.generatorContext, options, cache }
          for (const generator of state.schemaGenerators) {
            await this.dispatch({ result: await generator.schema!(transformedNode, ctx), renderer: generator.renderer })
          }
          await this.hooks.callHook('kubb:generate:schema', transformedNode, ctx)
        } catch (caughtError) {
          state.error = toError(caughtError)
        }
      }
    }

    // One pass over operations feeds both the per-operation generators and the batch each plugin's
    // `operations` receives, so every node is transformed and filtered exactly once. A plugin with
    // only an `operations` generator still collects its filtered nodes here.
    for (const node of operations) {
      const cache = createNodeCache()
      for (const state of states) {
        if (state.error || (!state.operationGenerators.length && !state.operationsGenerators.length)) continue
        try {
          const resolved = resolveForPlugin(state, node)
          if (!resolved) continue

          state.pluginOperations.push(resolved.transformedNode)

          if (state.operationGenerators.length) {
            const ctx = { ...state.generatorContext, options: resolved.options, cache }
            for (const generator of state.operationGenerators) {
              await this.dispatch({ result: await generator.operation!(resolved.transformedNode, ctx), renderer: generator.renderer })
            }
            await this.hooks.callHook('kubb:generate:operation', resolved.transformedNode, ctx)
          }
        } catch (caughtError) {
          state.error = toError(caughtError)
        }
      }
    }

    // The `operations` batch fires once per plugin after the single operation walk, in dependency
    // order, with a fresh cache since it spans every node rather than one.
    for (const state of states) {
      if (state.error || !state.operationsGenerators.length) continue
      try {
        const ctx = { ...state.generatorContext, options: state.plugin.options, cache: createNodeCache() }
        for (const generator of state.operationsGenerators) {
          await this.dispatch({ result: await generator.operations!(state.pluginOperations, ctx), renderer: generator.renderer })
        }
        await this.hooks.callHook('kubb:generate:operations', state.pluginOperations, ctx)
      } catch (caughtError) {
        state.error = toError(caughtError)
      }
    }

    // Close out every plugin in dependency order, so `kubb:plugin:end` and the timing diagnostics
    // still count up in plugin order for the CLI's `Plugins N/M` line.
    for (const state of states) {
      const duration = getElapsedMs(state.hrStart)
      await this.#emitPluginEnd({ plugin: state.plugin, duration, success: !state.error, error: state.error ?? undefined })

      if (state.error) {
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
    for (const unhook of this.#unhooks) unhook()
    this.#unhooks.length = 0
    this.#transforms.dispose()
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

  /**
   * Merges `partial` onto a fresh default resolver and stores the result on `plugin.resolver`,
   * which is the single source `getResolver` and `getPlugin(name).resolver` both read.
   */
  setPluginResolver(pluginName: string, partial: ResolverPatch | Resolver): void {
    const plugin = this.plugins.get(pluginName)
    if (!plugin) return

    plugin.resolver = Resolver.merge(createResolver<PluginFactoryOptions>({ pluginName }), partial)
  }

  /**
   * Returns the resolver for the given plugin. It reads `plugin.resolver` (seeded with the default
   * at registration and replaced by `setPluginResolver`), falling back to a fresh default for a
   * name that is not a registered plugin.
   */
  getResolver<TName extends PluginName>(pluginName: TName): ResolvePluginOptions<TName>['resolver']
  getResolver(pluginName: string): Resolver {
    return this.plugins.get(pluginName)?.resolver ?? createResolver<PluginFactoryOptions>({ pluginName })
  }

  getContext<TOptions extends PluginFactoryOptions>(plugin: NormalizedPlugin<TOptions>): Omit<GeneratorContext<TOptions>, 'options' | 'cache'> {
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

  getPlugin<TName extends PluginName>(pluginName: TName): Plugin<ResolvePluginOptions<TName>> | undefined
  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName)
  }

  /**
   * Like `getPlugin` but throws a descriptive error when the plugin is not found.
   */
  requirePlugin<TName extends PluginName>(pluginName: TName, context?: RequirePluginContext): Plugin<ResolvePluginOptions<TName>>
  requirePlugin(pluginName: string, context?: RequirePluginContext): Plugin {
    const plugin = this.getPlugin(pluginName)
    if (plugin) return plugin

    const requiredBy = context?.requiredBy
    const by = requiredBy ? ` by "${requiredBy}"` : ''
    const help = requiredBy ? ` (required by "${requiredBy}")` : ''

    throw new Diagnostics.Error({
      code: Diagnostics.code.pluginNotFound,
      severity: 'error',
      message: `Plugin "${pluginName}" is required${by} but not found. Make sure it is included in your Kubb config.`,
      help: `Add "${pluginName}" to the \`plugins\` array in kubb.config.ts${help}, or remove the dependency on it.`,
      location: { kind: 'config' },
    })
  }
}
