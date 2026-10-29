import { resolve } from 'node:path'
import { getElapsedMs, toError } from '@internals/utils'
import { ast, collectUsedSchemaNames, compareEnforce, type FileNode, type InputMeta, type InputNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import { type Diagnostic, type DiagnosticLocation, Diagnostics, type ProblemDiagnostic } from './Diagnostics.ts'
import type { Generator, GeneratorContext } from './defineGenerator.ts'
import type { Parser } from './defineParser.ts'
import type { KubbPluginSetupContext, Plugin, PluginName, ResolvePluginOptions, Group, NormalizedPlugin, PluginType } from './definePlugin.ts'
import { normalizeOutput } from './definePlugin.ts'
import { checkCompatibility, checkDependencies, resolveMeta } from './defineExtension.ts'
import { kubbContext } from './composables.ts'
import { createResolver } from './createResolver.ts'
import { Resolver } from './Resolver.ts'
import { FileManager } from './FileManager.ts'
import { type MemoKey, type MemoValue, memoize } from './memo.ts'
import { createNodeCache } from './nodeCache.ts'
import type { OutputManifest } from './outputManifest.ts'
import { checkoutGitInput, gitInputRegExp } from './gitInput.ts'
import { inputToAdapterSource } from './input.ts'

import type { Config, KubbHooks } from './types.ts'
import type { Adapter, AdapterSource } from './createAdapter.ts'
import type { Hookable } from './Hookable.ts'

type Options = {
  hooks: Hookable<KubbHooks>
  signal?: AbortSignal
  /**
   * Passed to `fileManager.write` so files the output passes already normalized are left alone.
   */
  manifest?: OutputManifest
  /**
   * The output directory `output.clean` empties. Emptied right before the files are written, so a
   * run that fails earlier leaves the previous output in place.
   */
  cleanPath?: string
}

type RequirePluginContext = {
  /**
   * Name of the plugin that declared the dependency, included in the error so users can
   * trace which plugin needs the missing one.
   */
  requiredBy?: string
}

type ResolvedNode<TNode extends SchemaNode | OperationNode> = {
  transformedNode: TNode
  options: NormalizedPlugin['options']
}

/** `include` filter types that select operations, and so prune the schemas they do not reach. */
const OPERATION_FILTER_TYPES: ReadonlySet<string> = new Set(['tag', 'operationId', 'path', 'method', 'contentType', 'extension'])

/**
 * The options bag a `NormalizedPlugin` starts with before a plugin refines it: a directory output
 * at the plugin root and empty filter lists.
 */
const defaultPluginOptions = (): NormalizedPlugin['options'] => ({ output: { path: '.', mode: 'directory' }, exclude: [], override: [] })

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

/**
 * Throws `KUBB_INVALID_PLUGIN_OPTIONS` when a `plugins` entry is not a plugin object, such as a
 * factory passed without calling it.
 */
function assertPluginEntry(entry: unknown, index: number): asserts entry is Plugin {
  if (typeof entry === 'object' && entry !== null) return

  const name = typeof entry === 'function' ? entry.name || 'pluginName' : undefined
  throw new Diagnostics.Error({
    code: Diagnostics.code.invalidPluginOptions,
    severity: 'error',
    message: name
      ? `plugins[${index}] is a function ("${name}"), not a plugin.`
      : `plugins[${index}] is ${entry === null ? 'null' : typeof entry}, not a plugin.`,
    help: name ? `Call it: ${name}()` : 'Pass the result of a plugin factory, for example `pluginTs()`, or remove the entry.',
    location: { kind: 'config' },
  })
}

/**
 * Where a generator crashed: a label naming the node and, when the adapter set one, the node's
 * pointer into the input.
 */
function getCrashSite(node: SchemaNode | OperationNode): { label: string; location?: DiagnosticLocation } {
  if (node.kind === ast.nodeKinds.schema) {
    const label = node.name ? `schema "${node.name}"` : 'an inline schema'
    return { label, location: node.pointer ? { kind: 'schema', pointer: node.pointer } : undefined }
  }
  const label = node.method && node.path ? `operation "${node.operationId}" (${node.method.toUpperCase()} ${node.path})` : `operation "${node.operationId}"`
  return { label, location: node.pointer ? { kind: 'operation', pointer: node.pointer } : undefined }
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
  readonly #memo = new Map<string, unknown>()

  /**
   * Removers for every listener the driver added (plugin, generator) so `dispose()` can detach
   * them in one pass. External `hooks.hook(...)` listeners are not tracked.
   */
  readonly #unhooks: Array<() => void> = []

  constructor(config: Config, options: Options) {
    this.config = config
    this.options = options
    this.adapter = config.adapter ?? null
  }

  /**
   * Checks the adapter's and parsers' `meta.compatibility`, then normalizes and checks every configured plugin, orders them, and registers their lifecycle handlers.
   * A plugin that another lists as a dependency runs first, then `enforce: 'pre'` before
   * `'post'`. When the config has an adapter, the adapter source is resolved from the input
   * so `run` can parse it later.
   */
  async setup() {
    this.options.signal?.throwIfAborted()
    for (const extension of [this.config.adapter, ...this.config.parsers]) {
      if (extension?.meta) checkCompatibility(extension.meta)
    }

    // Plugins are keyed by name, so a second entry with the same name would silently replace the first.
    const names = new Set<string>()
    const normalized = this.#sortPlugins(
      this.config.plugins.map((rawPlugin, index) => {
        assertPluginEntry(rawPlugin, index)
        if (rawPlugin.meta) checkCompatibility(rawPlugin.meta)

        const meta = resolveMeta(rawPlugin)
        if (names.has(meta.name)) {
          throw new Diagnostics.Error({
            code: Diagnostics.code.invalidPluginOptions,
            severity: 'error',
            message: `Plugin "${meta.name}" appears twice in \`plugins\`.`,
            help: 'Remove the duplicate, or merge its options.',
            location: { kind: 'config' },
          })
        }
        names.add(meta.name)
        const normalizedPlugin: NormalizedPlugin = {
          name: meta.name,
          meta,
          dependencies:
            typeof rawPlugin.dependencies === 'function' ? rawPlugin.dependencies(rawPlugin.options ?? {}, { config: this.config }) : rawPlugin.dependencies,
          enforce: rawPlugin.enforce,
          hooks: rawPlugin.hooks,
          setup: rawPlugin.setup,
          // `rawPlugin.options` is the user-supplied shape. The normalized `output`/`exclude`/`override`
          // bag is filled in by the post-setup `normalizePluginOptions` pass, after `setOptions` runs.
          options: (rawPlugin.options ?? defaultPluginOptions()) as NormalizedPlugin['options'],
          resolver: createResolver<PluginType>({ pluginName: meta.name }),
        }
        return normalizedPlugin
      }),
    )

    const byName = new Map(normalized.map((plugin) => [plugin.name, plugin]))
    for (const plugin of normalized) {
      checkDependencies({ name: plugin.name, dependencies: plugin.dependencies, plugins: byName })
    }

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
    const queue = [...plugins].sort((a, b) => compareEnforce(a.enforce, b.enforce))
    const names = new Set(queue.map((plugin) => plugin.name))
    const blockedBy = new Map(
      queue.map((plugin) => {
        const dependencies = Array.isArray(plugin.dependencies) ? plugin.dependencies : Object.keys(plugin.dependencies ?? {})
        return [plugin.name, new Set(dependencies.filter((name) => names.has(name) && name !== plugin.name))]
      }),
    )

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

    this.options.signal?.throwIfAborted()
    const source = this.#adapterSource
    const checkout = source.type === 'path' && gitInputRegExp.test(source.path) ? await checkoutGitInput(source.path, this.options.signal) : undefined
    try {
      this.inputNode = await this.adapter.parse(checkout ? { type: 'path', path: checkout.path } : source, { signal: this.options.signal })
    } catch (caughtError) {
      throw new Diagnostics.Error(Diagnostics.fromExtension(caughtError, { kind: 'adapter', extension: this.adapter }))
    } finally {
      await checkout?.dispose()
    }
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
   * Runs each plugin's `setup` and `kubb:plugin:setup` handler, in plugin order, with a context scoped to that
   * plugin so `addGenerator`, `setResolver`, `addMacro`, `setMacros`, and `setOptions` target its
   * `NormalizedPlugin` entry. Called once from `run` before the plugin execution loop begins, so
   * plugins can configure generators, resolvers, macros, and options before `buildStart`.
   */
  async setupHooks(): Promise<void> {
    for (const plugin of this.plugins.values()) {
      const setupHook = plugin.hooks?.['kubb:plugin:setup']
      if (!plugin.setup && !setupHook) continue

      const ctx: KubbPluginSetupContext = {
        config: this.config,
        options: plugin.options ?? {},
        addGenerator: (...generators) => {
          plugin.generators = [...(plugin.generators ?? []), ...generators]
        },
        setResolver: (resolver) => {
          plugin.resolver = Resolver.merge(createResolver<PluginType>({ pluginName: plugin.name }), resolver)
        },
        addMacro: (macro) => {
          plugin.macros = [...(plugin.macros ?? []), macro]
        },
        setMacros: (macros) => {
          plugin.macros = [...macros]
        },
        setOptions: (opts) => {
          plugin.options = normalizePluginOptions({ ...plugin.options, ...opts }, plugin.name)
        },
        injectFile: (userFileNode) => {
          this.fileManager.add(ast.factory.createFile(userFileNode))
        },
        requirePlugin: ((name: string) => this.requirePlugin(name, { requiredBy: plugin.name })) as KubbPluginSetupContext['requirePlugin'],
        memo: this.memo.bind(this),
      }

      try {
        // Composables such as `addGenerator()` read `ctx` from `kubbContext`, also after an `await` in setup.
        await kubbContext.run(ctx, async () => {
          if (plugin.setup) {
            plugin.options = normalizePluginOptions(await plugin.setup(ctx.options, ctx), plugin.name)
          }
          await setupHook?.(ctx)
        })
      } catch (caughtError) {
        // Attributed to the plugin, so the run summary counts it as a failed plugin.
        throw new Diagnostics.Error(Diagnostics.fromExtension(caughtError, { kind: 'plugin', extension: plugin }))
      }
    }
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
    const parsersMap = new Map<FileNode['extname'], Parser>()

    for (const parser of config.parsers) {
      if (parser.extNames) {
        for (const ext of parser.extNames) parsersMap.set(ext, parser)
      }
    }

    // Make `diagnostics` the active sink so deep code (adapter parse, generators) can
    // report into this run via `Diagnostics.report`.
    return Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      async () => {
        try {
          this.options.signal?.throwIfAborted()
          const outputRoot = resolve(config.root, config.output.path)

          // Parse the adapter source into `this.inputNode`.
          await this.#parseInput()
          // Emit `kubb:plugin:setup` so plugins can register macros via `addMacro`/`setMacros`.
          await this.setupHooks()

          // Normalize each plugin's options once setup hooks have run, so the generate loop always
          // sees a filled-in bag whether or not the plugin called `setOptions`.
          for (const plugin of this.plugins.values()) {
            this.options.signal?.throwIfAborted()
            plugin.options = normalizePluginOptions(plugin.options, plugin.name)
          }

          if (this.adapter && this.inputNode) {
            const { meta, schemas, operations } = this.inputNode
            const buildStartContext = this.#withFiles({
              config,
              adapter: this.adapter,
              meta,
              nodeCounts: { schemas: schemas.length, operations: operations.length },
              getPlugin: this.getPlugin.bind(this),
            })
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
              diagnostics.push(...(await this.#finishPlugin({ plugin, hrStart, error: toError(caughtError) })))
              continue
            }

            if ((plugin.generators?.length ?? 0) > 0) {
              generatorPlugins.push({ plugin, context, hrStart })
              continue
            }

            diagnostics.push(...(await this.#finishPlugin({ plugin, hrStart })))
          }

          // Run every node through each plugin's macros and generators.
          diagnostics.push(...(await this.#runGenerators(generatorPlugins)))
          this.#inlineFiles(parsersMap)

          await hooks.callHook('kubb:plugins:end', this.#withFiles({ config }))

          // Write every generated file once, after post-processing (barrel etc.) has had its
          // chance to add more. Writing mid-generation measured no faster in practice, so a
          // single pass keeps the pipeline simpler.
          if (this.options.cleanPath) await config.storage.empty(this.options.cleanPath)

          await fileManager.write(fileManager.files, {
            storage: config.storage,
            parsers: parsersMap,
            manifest: this.options.manifest,
            signal: this.options.signal,
            cleaned: this.options.cleanPath,
            hooks,
            config,
          })

          await this.adapter?.settle?.()
          await hooks.callHook('kubb:build:end', { files: this.fileManager.files, config, outputDir: outputRoot })

          return { diagnostics: Diagnostics.dedupe(diagnostics) }
        } catch (caughtError) {
          await this.adapter?.settle?.()
          diagnostics.push(Diagnostics.from(caughtError))
          return { diagnostics: Diagnostics.dedupe(diagnostics) }
        }
      },
    )
  }

  /**
   * Moves inline sources into the files that import them and drops the virtual files, before barrels
   * (`kubb:plugins:end`) and the write see them.
   */
  #inlineFiles(parsers: ReadonlyMap<FileNode['extname'], Parser>): void {
    const { files, virtualPaths, problems } = ast.inlineFiles(this.fileManager.files, { language: (file) => parsers.get(file.extname)?.inline })
    if (virtualPaths.length === 0) return

    this.fileManager.add(...files)
    this.fileManager.delete(...virtualPaths)
    // One diagnostic for all problems: `Diagnostics.dedupe` keeps one per code when there is no location.
    if (problems.length > 0) {
      Diagnostics.report({
        code: Diagnostics.code.inlineFailed,
        severity: 'error',
        message: problems.map(({ path, message }) => `${path}: ${message}`).join('\n'),
        help: 'Give every name the file imports an inline definition, register a parser with inline support for its extension, or stop marking the source as inline.',
      })
    }
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

  /** Emits `kubb:plugin:end` and returns the plugin's failure, if any, followed by its timing. */
  async #finishPlugin({
    plugin,
    hrStart,
    error,
    crashSite,
  }: {
    plugin: NormalizedPlugin
    hrStart: ReturnType<typeof process.hrtime>
    error?: Error
    crashSite?: ReturnType<typeof getCrashSite>
  }): Promise<Array<Diagnostic>> {
    const duration = getElapsedMs(hrStart)
    await this.hooks.callHook('kubb:plugin:end', this.#withFiles({ plugin, duration, success: !error, ...(error ? { error } : {}), config: this.config }))

    const timing = Diagnostics.performance({ plugin: plugin.name, duration })
    if (!error) return [timing]

    const diagnostic = Diagnostics.fromExtension(error, { kind: 'plugin', extension: plugin })
    const site = diagnostic.code === Diagnostics.code.pluginFailed && !diagnostic.location ? crashSite : undefined
    return [
      site
        ? { ...diagnostic, message: `While generating ${site.label}: ${diagnostic.message}`, ...(site.location ? { location: site.location } : {}) }
        : diagnostic,
      timing,
    ]
  }

  /**
   * Runs schemas and operations through every plugin's generators. The walk is node-outer: each
   * schema is visited once and each operation once, and the node fans out to the matching
   * generators of every plugin in dependency order. A per-node cache (`createNodeCache`) is created
   * once per node and shared by all of that node's plugins, so node-derived work is computed once
   * and reused instead of recomputed per plugin. Each node still runs through the plugin's macros
   * and its exclude/include/override filters before that plugin's
   * generator sees it, so plugins stay isolated. Schemas run before operations so file output
   * stays deterministic across runs. A generator with a `match` predicate that resolves `false`
   * for a node is skipped for that node, without calling `schema`/`operation`.
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
      for (const { plugin, hrStart } of entries) diagnostics.push(...(await this.#finishPlugin({ plugin, hrStart })))
      return diagnostics
    }

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
        schemas: new Map<SchemaNode, ResolvedNode<SchemaNode> | Error>(),
        operationGenerators: generators.filter((generator) => generator.operation),
        operationsGenerators: generators.filter((generator) => generator.operations),
        pluginOperations: [] as Array<OperationNode>,
        error: null as Error | null,
        // The node a generator crashed on, so the diagnostic can name it.
        crashSite: undefined as ReturnType<typeof getCrashSite> | undefined,
      }
    })

    type PluginState = (typeof states)[number]

    // Applies the plugin's macros, then resolves options (skipping the resolver when
    // optionsAreStatic). Returns null when include/exclude/override rules out the node. The
    // per-node dispatch and the collected-operations batch both go through this so they agree on
    // what the plugin sees.
    const resolveForPlugin = <TNode extends SchemaNode | OperationNode>(state: PluginState, node: TNode): ResolvedNode<TNode> | null => {
      const transformedNode = ast.applyMacros(node, state.plugin.macros ?? [])
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

    // Prepare schemas once so reservations use the same names and filters as generation.
    for (const state of states) {
      if (!state.schemaGenerators.length) continue
      for (const node of schemas) {
        try {
          const resolved = resolveForPlugin(state, node)
          if (!resolved) continue
          const name = resolved.transformedNode.name
          if (state.allowedSchemaNames !== null && name && !state.allowedSchemaNames.has(name)) continue
          state.schemas.set(node, resolved)
          if (name) state.generatorContext.resolver.reserveNames([state.generatorContext.resolver.name(name)])
        } catch (caughtError) {
          // Report the failure at this node's turn, preserving output from earlier schemas.
          state.schemas.set(node, toError(caughtError))
          break
        }
      }
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
          const resolved = state.schemas.get(node)
          if (resolved instanceof Error) throw resolved
          if (!resolved) continue

          const { transformedNode, options } = resolved

          const ctx = { ...state.generatorContext, options, cache }
          await this.#dispatchNode({
            generators: state.schemaGenerators,
            node: transformedNode,
            ctx,
            generate: (generator) => generator.schema!(transformedNode, ctx),
          })
          await this.hooks.callHook('kubb:generate:schema', transformedNode, ctx)
        } catch (caughtError) {
          state.error = toError(caughtError)
          state.crashSite = getCrashSite(node)
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
            const { transformedNode } = resolved
            const ctx = { ...state.generatorContext, options: resolved.options, cache }
            await this.#dispatchNode({
              generators: state.operationGenerators,
              node: transformedNode,
              ctx,
              generate: (generator) => generator.operation!(transformedNode, ctx),
            })
            await this.hooks.callHook('kubb:generate:operation', transformedNode, ctx)
          }
        } catch (caughtError) {
          state.error = toError(caughtError)
          state.crashSite = getCrashSite(node)
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
          await this.fileManager.dispatch({ result: await generator.operations!(state.pluginOperations, ctx), renderer: generator.renderer })
        }
        await this.hooks.callHook('kubb:generate:operations', state.pluginOperations, ctx)
      } catch (caughtError) {
        state.error = toError(caughtError)
      }
    }

    // Close out every plugin in dependency order, so `kubb:plugin:end` and the timing diagnostics
    // still count up in plugin order for the CLI's `Plugins N/M` line.
    for (const { plugin, hrStart, error, crashSite } of states) {
      diagnostics.push(...(await this.#finishPlugin({ plugin, hrStart, error: error ?? undefined, crashSite })))
    }

    return diagnostics
  }

  /**
   * Runs `node` through the generators whose `match` accepts it; `generate` picks the method for the
   * node kind.
   */
  async #dispatchNode({
    generators,
    node,
    ctx,
    generate,
  }: {
    generators: Array<Generator>
    node: SchemaNode | OperationNode
    ctx: GeneratorContext
    generate: (generator: Generator) => ReturnType<NonNullable<Generator['schema']>>
  }): Promise<void> {
    for (const generator of generators) {
      const matches = generator.match ? await generator.match(node, ctx) : true
      if (!matches) continue
      await this.fileManager.dispatch({ result: await generate(generator), renderer: generator.renderer, pointer: node.pointer })
    }
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
    // Release the FileNode cache and parsed adapter graph so memory is reclaimed
    // between builds. The returned `BuildOutput.files` array still references any
    // FileNodes the caller needs to inspect.
    this.fileManager.dispose()
    this.inputNode = null
    this.#adapterSource = null
    this.#memo.clear()
  }

  [Symbol.dispose](): void {
    this.dispose()
  }

  /** Reads `plugin.resolver`, falling back to a fresh default for a name that is not a registered plugin. */
  getResolver<TName extends PluginName>(pluginName: TName): ResolvePluginOptions<TName>['resolver']
  getResolver(pluginName: string): Resolver {
    return this.plugins.get(pluginName)?.resolver ?? createResolver<PluginType>({ pluginName })
  }

  memo<TKey extends MemoKey, TValue extends MemoValue<TKey>>(key: TKey, compute: () => TValue): TValue {
    return memoize(this.#memo, key, compute)
  }

  getContext<TOptions extends PluginType>(plugin: NormalizedPlugin<TOptions>): Omit<GeneratorContext<TOptions>, 'options' | 'cache'> {
    const driver = this

    // Collect into the active build only. The host renders each collected diagnostic once after the
    // build (the CLI via `Diagnostics.emit`, the agent via its post-build loop), so emitting a live
    // `kubb:error`/`kubb:warn`/`kubb:info` here would render it twice.
    const report = (diagnostic: Omit<ProblemDiagnostic, 'plugin'>): void => {
      Diagnostics.report({ ...diagnostic, plugin: plugin.name })
    }

    return {
      config: driver.config,
      signal: driver.options.signal,
      get root(): string {
        return resolve(driver.config.root, driver.config.output.path)
      },
      hooks: driver.hooks,
      plugin,
      getPlugin: driver.getPlugin.bind(driver),
      // Close over the owning plugin so a missing dependency error names who required it.
      requirePlugin: ((name: string) => driver.requirePlugin(name, { requiredBy: plugin.name })) as GeneratorContext<TOptions>['requirePlugin'],
      getResolver: driver.getResolver.bind(driver),
      memo: driver.memo.bind(driver),
      driver,
      addFile: async (...files: Array<FileNode>) => {
        driver.fileManager.add(...files)
      },
      upsertFile: async (...files: Array<FileNode>) => {
        driver.fileManager.upsert(...files)
      },
      get meta(): InputMeta {
        return driver.inputNode?.meta ?? {}
      },
      get adapter(): Adapter {
        // Generators only read `adapter` during AST hooks, which run after the
        // adapter is set, so it is guaranteed defined at read time.
        return driver.adapter!
      },
      get resolver() {
        return driver.getResolver(plugin.name)
      },
      warn(message, options) {
        report({ code: Diagnostics.code.pluginWarning, severity: 'warning', message, ...options })
      },
      error(error, options) {
        if (Diagnostics.isError(error)) {
          report({ ...options, ...error.diagnostic })
          return
        }
        const cause = typeof error === 'string' ? undefined : error
        report({ code: Diagnostics.code.pluginFailed, severity: 'error', message: typeof error === 'string' ? error : error.message, cause, ...options })
      },
      info(message, options) {
        report({ code: Diagnostics.code.pluginInfo, severity: 'info', message, ...options })
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

    throw pluginNotFoundError({ pluginName, requiredBy: context?.requiredBy })
  }
}

/** The `KUBB_PLUGIN_NOT_FOUND` error `requirePlugin` throws, naming the plugin that needed it. */
export function pluginNotFoundError({ pluginName, requiredBy }: { pluginName: string; requiredBy?: string }): InstanceType<typeof Diagnostics.Error> {
  const by = requiredBy ? ` by "${requiredBy}"` : ''
  const help = requiredBy ? ` (required by "${requiredBy}")` : ''

  return new Diagnostics.Error({
    code: Diagnostics.code.pluginNotFound,
    severity: 'error',
    message: `Plugin "${pluginName}" is required${by} but not found. Make sure it is included in your Kubb config.`,
    help: `Add "${pluginName}" to the \`plugins\` array in kubb.config.ts${help}, or remove the dependency on it.`,
    location: { kind: 'config' },
    ...(requiredBy ? { plugin: requiredBy } : {}),
  })
}
