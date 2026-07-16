import { resolve } from 'node:path'
import { getElapsedMs, memoize, toError } from '@internals/utils'
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

  readonly #resolvers = new Map<string, Resolver>()
  readonly #defaultResolvers = new Map<string, Resolver>()

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
          // `rawPlugin.options` is the user-supplied shape, not yet the normalized `output`/`exclude`/`override`
          // bag every `NormalizedPlugin` carries; plugins fill it in via `setOptions` during `kubb:plugin:setup`.
          options: (rawPlugin.options ?? { output: { path: '.', mode: 'directory' }, exclude: [], override: [] }) as NormalizedPlugin['options'],
          resolver: this.#getDefaultResolver(rawPlugin.name),
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

          if (this.adapter && this.inputNode) {
            await hooks.callHook(
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

          await hooks.callHook('kubb:plugins:end', Object.assign({ config }, this.#filesPayload()))

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
    return this.hooks.callHook(
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

    for (const { plugin, context, hrStart } of entries) {
      const generatorContext = { ...context, resolver: this.getResolver(plugin.name) }
      const { exclude, include, override } = plugin.options
      const optionsAreStatic = !exclude?.length && !include?.length && !override?.length
      const allowedSchemaNames = allowedSchemaNamesByPlugin.get(plugin.name) ?? null

      const generators = plugin.generators ?? []
      const schemaGenerators = generators.filter((generator) => generator.schema)
      const operationGenerators = generators.filter((generator) => generator.operation)
      const operationsGenerators = generators.filter((generator) => generator.operations)

      let error: Error | null = null

      // Applies the plugin's macros, then resolves options (skipping the resolver when
      // optionsAreStatic). Returns null when include/exclude/override rules out the node.
      // The per-node dispatch and the collected-operations batch both go through this so
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

      // Schemas before operations, in adapter order, so file output stays deterministic. A caught
      // error stops this plugin but not the others, so its remaining nodes are skipped rather than
      // retried. Generators run directly; `kubb:generate:*` still fires for external observers.
      if (schemaGenerators.length) {
        for (const node of schemas) {
          if (error) break
          try {
            const resolved = resolveForPlugin(node)
            if (!resolved) continue

            const { transformedNode, options } = resolved
            if (allowedSchemaNames !== null && transformedNode.name && !allowedSchemaNames.has(transformedNode.name)) continue

            const ctx = { ...generatorContext, options }
            for (const generator of schemaGenerators) {
              await this.dispatch({ result: await generator.schema!(transformedNode, ctx), renderer: generator.renderer })
            }
            await this.hooks.callHook('kubb:generate:schema', transformedNode, ctx)
          } catch (caughtError) {
            error = toError(caughtError)
          }
        }
      }

      // One pass over operations feeds both the per-operation generators and the batch handed to
      // `operations`, so each node is transformed and filtered exactly once.
      const pluginOperations: Array<OperationNode> = []
      if (operationGenerators.length || operationsGenerators.length) {
        for (const node of operations) {
          if (error) break
          try {
            const resolved = resolveForPlugin(node)
            if (!resolved) continue

            pluginOperations.push(resolved.transformedNode)

            if (operationGenerators.length) {
              const ctx = { ...generatorContext, options: resolved.options }
              for (const generator of operationGenerators) {
                await this.dispatch({ result: await generator.operation!(resolved.transformedNode, ctx), renderer: generator.renderer })
              }
              await this.hooks.callHook('kubb:generate:operation', resolved.transformedNode, ctx)
            }
          } catch (caughtError) {
            error = toError(caughtError)
          }
        }
      }

      if (!error && operationsGenerators.length) {
        try {
          const ctx = { ...generatorContext, options: plugin.options }
          for (const generator of operationsGenerators) {
            await this.dispatch({ result: await generator.operations!(pluginOperations, ctx), renderer: generator.renderer })
          }
          await this.hooks.callHook('kubb:generate:operations', pluginOperations, ctx)
        } catch (caughtError) {
          error = toError(caughtError)
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
    for (const unhook of this.#unhooks) unhook()
    this.#unhooks.length = 0
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
  setPluginResolver(pluginName: string, partial: ResolverPatch | Resolver): void {
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
  getResolver<TName extends PluginName>(pluginName: TName): ResolvePluginOptions<TName>['resolver']
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
