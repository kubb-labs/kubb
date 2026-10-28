import { resolve } from 'node:path'
import { deserialize, serialize } from 'node:v8'
import type { Worker } from 'node:worker_threads'
import { getElapsedMs, toError } from '@internals/utils'
import { ast, collectUsedSchemaNames, type Enforce, type FileNode, type InputMeta, type InputNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import { type Diagnostic, type DiagnosticLocation, Diagnostics, type ProblemDiagnostic } from './Diagnostics.ts'
import type { Generator, GeneratorContext } from './defineGenerator.ts'
import type { Parser } from './defineParser.ts'
import type { KubbPluginSetupContext, Plugin, PluginName, ResolvePluginOptions, Group, NormalizedPlugin, PluginType } from './definePlugin.ts'
import { normalizeOutput } from './definePlugin.ts'
import { checkCompatibility, checkDependencies, resolveMeta } from './defineExtension.ts'
import { kubbContext } from './composables.ts'
import { createResolver } from './createResolver.ts'
import { type NameEvent, type NameState, replayNames, Resolver } from './Resolver.ts'
import { FileManager } from './FileManager.ts'
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
  /** Splits the per-node walk over worker threads, each started by `spawn` and running `runGenerateWorker` on the same config. */
  workers?: GenerateWorkers
}

/** How many worker threads `KubbDriver` splits a walk over, and how to start one. */
export type GenerateWorkers = {
  count: number
  spawn: () => Worker
}

type Range = [start: number, end: number]

/**
 * Nodes per chunk a thread takes at a time. Chunks are numbered schemas first, then operations, and
 * threads pull them from a shared counter, so an expensive stretch of the spec spreads over the threads.
 */
const CHUNK_SIZE = 32

/** What a worker thread needs from the main thread's parse: the input and the adapter's source document, which generators read through `ctx.adapter`. */
type ParsedState = { input: InputNode; document: Adapter['document'] }

/** Asks a worker thread to generate chunks from the `v8`-serialized {@link ParsedState} it shares, pulling chunk numbers from the `next` counter. */
export type GenerateRequest = { type: 'generate'; state: SharedArrayBuffer; next: SharedArrayBuffer }

/** Asks for the files. With `names`, the thread first adopts the names the whole walk resolved and generates its chunks again. */
export type EmitRequest = { type: 'emit'; names?: Record<string, NameState> }

export type WorkerRequest = GenerateRequest | EmitRequest

/** The name events of each chunk the thread took, per plugin, in the order it made them. */
export type GeneratedResponse = { type: 'generated'; names: Array<{ index: number; names: Record<string, Array<NameEvent>> }> }

/** The files of each chunk in first-added order, with the diagnostics the walk reported and the plugins that failed. */
export type EmittedResponse = {
  type: 'emitted'
  chunks: Array<{ index: number; files: Array<FileNode> }>
  diagnostics: Array<Diagnostic>
  errors: Record<string, ProblemDiagnostic>
}

export type WorkerResponse = GeneratedResponse | EmittedResponse | { type: 'error'; error: ProblemDiagnostic }

type Thread = {
  worker: Worker
  /** Rejects when the thread dies, so a request to a dead thread does not wait forever. */
  failed: Promise<never>
}

function spawnThread(spawn: () => Worker): Thread {
  const worker = spawn()
  const failed = new Promise<never>((_, reject) => {
    worker.once('error', reject)
    worker.once('exit', (code) => reject(new Error(`A generate worker thread exited with code ${code}.`)))
  })
  // Observed through `request`; a thread terminated at the end of the run must not surface as unhandled.
  failed.catch(() => undefined)
  return { worker, failed }
}

function request<T extends Exclude<WorkerResponse, { type: 'error' }>>(thread: Thread, message: WorkerRequest): Promise<T> {
  return Promise.race([
    thread.failed,
    new Promise<T>((resolve, reject) => {
      thread.worker.once('message', (response: WorkerResponse) => {
        if (response.type === 'error') reject(new Diagnostics.Error(response.error))
        else resolve(response as T)
      })
      thread.worker.postMessage(message)
    }),
  ])
}

/** Serializes the parsed state once into shared memory, so posting it to every thread copies nothing. */
function shareState(state: ParsedState): SharedArrayBuffer {
  const bytes = serialize(state)
  const shared = new SharedArrayBuffer(bytes.byteLength)
  new Uint8Array(shared).set(bytes)
  return shared
}

type GeneratorEntry = { plugin: NormalizedPlugin; context: Omit<GeneratorContext, 'options' | 'cache'>; hrStart: ReturnType<typeof process.hrtime> }

/** A plugin's frozen per-run state for the node walk. */
type PluginState = {
  plugin: NormalizedPlugin
  hrStart: ReturnType<typeof process.hrtime>
  generatorContext: Omit<GeneratorContext, 'options' | 'cache'>
  exclude: NormalizedPlugin['options']['exclude']
  include: NormalizedPlugin['options']['include']
  override: NormalizedPlugin['options']['override']
  optionsAreStatic: boolean
  allowedSchemaNames: Set<string> | null
  schemaGenerators: Array<Generator>
  schemas: Map<SchemaNode, ResolvedNode<SchemaNode> | Error>
  operationGenerators: Array<Generator>
  operationsGenerators: Array<Generator>
  pluginOperations: Array<OperationNode>
  error: Error | null
  /** The node a generator crashed on, so the diagnostic can name it. */
  crashSite: ReturnType<typeof getCrashSite> | undefined
}

/** What a walk does per node: run the generators, fire `kubb:generate:*`, or both. */
type WalkOptions = { dispatch: boolean; hooks: boolean }

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

const ENFORCE_ORDER = { pre: -1, post: 1 } satisfies Record<Enforce, number>

/** `include` filter types that select operations, and so prune the schemas they do not reach. */
const OPERATION_FILTER_TYPES: ReadonlySet<string> = new Set(['tag', 'operationId', 'path', 'method', 'contentType', 'extension'])

const enforceWeight = (plugin: NormalizedPlugin): number => (plugin.enforce ? ENFORCE_ORDER[plugin.enforce] : 0)

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
  if (typeof entry === 'function') {
    const name = entry.name || 'pluginName'
    throw new Diagnostics.Error({
      code: Diagnostics.code.invalidPluginOptions,
      severity: 'error',
      message: `plugins[${index}] is a function ("${name}"), not a plugin.`,
      help: `Call it: ${name}()`,
      location: { kind: 'config' },
    })
  }
  if (typeof entry !== 'object' || entry === null) {
    throw new Diagnostics.Error({
      code: Diagnostics.code.invalidPluginOptions,
      severity: 'error',
      message: `plugins[${index}] is ${entry === null ? 'null' : typeof entry}, not a plugin.`,
      help: 'Pass the result of a plugin factory, for example `pluginTs()`, or remove the entry.',
      location: { kind: 'config' },
    })
  }
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

/** Applies the plugin's macros, then its include/exclude/override rules; `null` when they rule the node out. */
function resolveForPlugin<TNode extends SchemaNode | OperationNode>(state: PluginState, node: TNode): ResolvedNode<TNode> | null {
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

  /** The worker threads of this run, started before the input is parsed so their boot overlaps it. */
  #threads: Array<Thread> = []
  /** Worker side: the chunks this thread took, and what its last walk produced. */
  #taken: ({ states: Array<PluginState>; indices: Array<number> } & Omit<EmittedResponse, 'type'>) | null = null

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
    const queue = [...plugins].sort((a, b) => enforceWeight(a) - enforceWeight(b))
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

          const { workers } = this.options
          if (workers && workers.count >= 2 && this.adapter) this.#threads = Array.from({ length: workers.count }, () => spawnThread(workers.spawn))

          // Parse the adapter source into `this.inputNode`.
          await this.#parseInput()
          await this.#setupPlugins()

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

          const generatorPlugins: Array<GeneratorEntry> = []

          for (const plugin of this.plugins.values()) {
            const context = this.getContext(plugin)
            const hrStart = process.hrtime()

            try {
              await hooks.callHook('kubb:plugin:start', { plugin })
            } catch (caughtError) {
              const error = toError(caughtError)
              const duration = getElapsedMs(hrStart)

              await this.#emitPluginEnd({ plugin, duration, success: false, error })

              diagnostics.push(
                Diagnostics.fromExtension(error, { kind: 'plugin', extension: plugin }),
                Diagnostics.performance({ plugin: plugin.name, duration }),
              )

              continue
            }

            if ((plugin.generators?.length ?? 0) > 0) {
              generatorPlugins.push({ plugin, context, hrStart })

              continue
            }

            const duration = getElapsedMs(hrStart)
            diagnostics.push(Diagnostics.performance({ plugin: plugin.name, duration }))

            await this.#emitPluginEnd({ plugin, duration, success: true })
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
        } finally {
          const threads = this.#threads
          this.#threads = []
          await Promise.all(threads.map(({ worker }) => worker.terminate()))
        }
      },
    )
  }

  /** Emits `kubb:plugin:setup`, then normalizes each plugin's options so the walk always sees a filled-in bag. */
  async #setupPlugins(): Promise<void> {
    await this.setupHooks()
    for (const plugin of this.plugins.values()) {
      this.options.signal?.throwIfAborted()
      plugin.options = normalizePluginOptions(plugin.options, plugin.name)
    }
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

  #emitPluginEnd({ plugin, duration, success, error }: { plugin: NormalizedPlugin; duration: number; success: boolean; error?: Error }): Promise<void> | void {
    return this.hooks.callHook('kubb:plugin:end', this.#withFiles({ plugin, duration, success, ...(error ? { error } : {}), config: this.config }))
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
   * With `options.workers`, `#splitWalk` runs the per-node walk over the worker threads.
   *
   * A failing plugin is dropped from the remaining walk, contributes an error diagnostic, and no
   * longer aborts the other plugins. `kubb:plugin:end` and each plugin's `timing` diagnostic fire
   * in dependency order once the walk finishes, driving the CLI's `Plugins N/M` counter. The
   * `operations` batch fires once per plugin after the single operation walk.
   *
   * When `this.inputNode` is `null`, every entry still gets a `kubb:plugin:end` so
   * post-plugin listeners (the barrel writer and friends) complete.
   */
  async #runGenerators(entries: Array<GeneratorEntry>): Promise<Array<Diagnostic>> {
    if (entries.length === 0) return []

    if (!this.inputNode) {
      const diagnostics: Array<Diagnostic> = []
      for (const { plugin, hrStart } of entries) {
        const duration = getElapsedMs(hrStart)
        diagnostics.push(Diagnostics.performance({ plugin: plugin.name, duration }))
        await this.#emitPluginEnd({ plugin, duration, success: true })
      }
      return diagnostics
    }

    const { schemas, operations } = this.inputNode
    const states = this.#prepareStates(entries)

    if (!(this.#threads.length && (await this.#splitWalk(states)))) {
      await this.#walkSchemas(states, [0, schemas.length], { dispatch: true, hooks: true })
      await this.#walkOperations(states, [0, operations.length], { dispatch: true, hooks: true })
    }

    await this.#runOperationsBatch(states)

    return this.#closePlugins(states)
  }

  /** Freezes each plugin's per-run state and prepares the schemas, so reservations use the same names and filters as generation. */
  #prepareStates(entries: Array<GeneratorEntry>): Array<PluginState> {
    const { schemas, operations } = this.inputNode!

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

    const states = entries.map(({ plugin, context, hrStart }): PluginState => {
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
        schemas: new Map(),
        operationGenerators: generators.filter((generator) => generator.operation),
        operationsGenerators: generators.filter((generator) => generator.operations),
        pluginOperations: [],
        error: null,
        crashSite: undefined,
      }
    })

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

    return states
  }

  /** Walks the schema range in adapter order; the plugins fan out per node in dependency order and share one cache. A caught error drops that plugin from the rest of the walk. */
  async #walkSchemas(states: Array<PluginState>, [start, end]: Range, { dispatch, hooks }: WalkOptions): Promise<void> {
    const { schemas } = this.inputNode!
    for (let index = start; index < end; index++) {
      const node = schemas[index]!
      const cache = createNodeCache()
      for (const state of states) {
        if (state.error || !state.schemaGenerators.length) continue
        try {
          const resolved = state.schemas.get(node)
          if (resolved instanceof Error) throw resolved
          if (!resolved) continue

          const { transformedNode, options } = resolved

          const ctx = { ...state.generatorContext, options, cache }
          if (dispatch) {
            await this.#dispatchNode({
              generators: state.schemaGenerators,
              node: transformedNode,
              ctx,
              generate: (generator) => generator.schema!(transformedNode, ctx),
            })
          }
          if (hooks) await this.hooks.callHook('kubb:generate:schema', transformedNode, ctx)
        } catch (caughtError) {
          state.error = toError(caughtError)
          state.crashSite = getCrashSite(node)
        }
      }
    }
  }

  /** Walks the operation range; one pass feeds the per-operation generators and collects each plugin's `operations` batch. */
  async #walkOperations(states: Array<PluginState>, [start, end]: Range, { dispatch, hooks }: WalkOptions): Promise<void> {
    const { operations } = this.inputNode!
    for (let index = start; index < end; index++) {
      const node = operations[index]!
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
            if (dispatch) {
              await this.#dispatchNode({
                generators: state.operationGenerators,
                node: transformedNode,
                ctx,
                generate: (generator) => generator.operation!(transformedNode, ctx),
              })
            }
            if (hooks) await this.hooks.callHook('kubb:generate:operation', transformedNode, ctx)
          }
        } catch (caughtError) {
          state.error = toError(caughtError)
          state.crashSite = getCrashSite(node)
        }
      }
    }
  }

  /** Fires each plugin's `operations` batch once, in dependency order, with a fresh cache since it spans every node. */
  async #runOperationsBatch(states: Array<PluginState>): Promise<void> {
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
  }

  /** Closes out every plugin in dependency order, so `kubb:plugin:end` and the timings count up in plugin order. */
  async #closePlugins(states: Array<PluginState>): Promise<Array<Diagnostic>> {
    const diagnostics: Array<Diagnostic> = []
    for (const state of states) {
      const duration = getElapsedMs(state.hrStart)
      await this.#emitPluginEnd({ plugin: state.plugin, duration, success: !state.error, error: state.error ?? undefined })

      if (state.error) diagnostics.push(this.#pluginDiagnostic(state))
      diagnostics.push(Diagnostics.performance({ plugin: state.plugin.name, duration }))
    }
    return diagnostics
  }

  /** The diagnostic for a plugin's `error`. Only a crash gains the node it failed on: a coded error already says where it is. */
  #pluginDiagnostic(state: PluginState): ProblemDiagnostic {
    const diagnostic = Diagnostics.fromExtension(state.error, { kind: 'plugin', extension: state.plugin })
    const site = diagnostic.code === Diagnostics.code.pluginFailed && !diagnostic.location ? state.crashSite : undefined
    return site
      ? { ...diagnostic, message: `While generating ${site.label}: ${diagnostic.message}`, ...(site.location ? { location: site.location } : {}) }
      : diagnostic
  }

  /**
   * Runs the per-node walk over the worker threads, each on a contiguous range of the schemas and of
   * the operations. The names every range took are replayed here in node order; a range that got
   * other names adopts the replayed ones and generates again, so the files match one unbroken walk.
   * `false` when the split cannot stand in for one walk, and the caller walks in-process.
   */
  async #splitWalk(states: Array<PluginState>): Promise<boolean> {
    const { schemas, operations } = this.inputNode!
    const count = Math.min(this.#threads.length, this.#chunkCount())
    if (count < 2) return false

    const threads = this.#threads.slice(0, count)
    const state = shareState({ input: this.inputNode!, document: this.adapter?.document ?? null })
    const next = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)
    const generated = await Promise.all(threads.map((thread) => request<GeneratedResponse>(thread, { type: 'generate', state, next })))
    const ordered = generated.flatMap((response, thread) => response.names.map((chunk) => ({ ...chunk, thread }))).sort((a, b) => a.index - b.index)

    // Every plugin's resolver, not only the generating ones: a plugin can resolve names through another plugin's resolver.
    const names: Record<string, NameState> = {}
    const identical = threads.map(() => true)
    for (const plugin of this.plugins.values()) {
      const replayed = replayNames(
        plugin.resolver.names,
        ordered.map((chunk) => chunk.names[plugin.name] ?? []),
      )
      if (!replayed) return false
      names[plugin.name] = replayed.state
      replayed.identical.forEach((same, index) => {
        if (!same) identical[ordered[index]!.thread] = false
      })
    }
    for (const plugin of this.plugins.values()) plugin.resolver.names = names[plugin.name]!

    const emitted = await Promise.all(
      threads.map((thread, index) => request<EmittedResponse>(thread, { type: 'emit', names: identical[index] ? undefined : names })),
    )

    for (const response of emitted) {
      for (const diagnostic of response.diagnostics) Diagnostics.report(diagnostic)
    }
    const chunks = emitted.flatMap((response) => response.chunks).sort((a, b) => a.index - b.index)
    for (const chunk of chunks) await this.fileManager.dispatch({ result: chunk.files })
    for (const state of states) {
      const failed = emitted.map((response) => response.errors[state.plugin.name]).find(Boolean)
      if (failed) state.error = new Diagnostics.Error(failed)
    }

    await this.#walkSchemas(states, [0, schemas.length], { dispatch: false, hooks: true })
    await this.#walkOperations(states, [0, operations.length], { dispatch: false, hooks: true })
    return true
  }

  /** How many chunks of {@link CHUNK_SIZE} the schemas and operations make. */
  #chunkCount(): number {
    const { schemas, operations } = this.inputNode!
    return Math.ceil(schemas.length / CHUNK_SIZE) + Math.ceil(operations.length / CHUNK_SIZE)
  }

  /** The nodes chunk `index` covers: a schema range, or an operation range once the schema chunks are used up. */
  #chunk(index: number): { phase: 'schemas' | 'operations'; range: Range } {
    const { schemas, operations } = this.inputNode!
    const schemaChunks = Math.ceil(schemas.length / CHUNK_SIZE)
    const [phase, start, length] =
      index < schemaChunks ? (['schemas', index, schemas.length] as const) : (['operations', index - schemaChunks, operations.length] as const)
    return { phase, range: [start * CHUNK_SIZE, Math.min(length, (start + 1) * CHUNK_SIZE)] }
  }

  /** @internal Worker side of `#splitWalk`: generates the chunks it pulls from `next` and returns the names its resolvers took. */
  async generateRange({ state, next }: GenerateRequest): Promise<GeneratedResponse> {
    const { input, document } = deserialize(new Uint8Array(state)) as ParsedState
    this.inputNode = input
    if (this.adapter) this.adapter.document = document
    await this.#setupPlugins()
    const entries = [...this.plugins.values()]
      .filter((plugin) => plugin.generators?.length)
      .map((plugin): GeneratorEntry => ({ plugin, context: this.getContext(plugin), hrStart: process.hrtime() }))
    this.#taken = { states: this.#prepareStates(entries), indices: [], chunks: [], diagnostics: [], errors: {} }

    const counter = new Int32Array(next)
    const total = this.#chunkCount()
    const indices = function* () {
      for (let index = Atomics.add(counter, 0, 1); index < total; index = Atomics.add(counter, 0, 1)) yield index
    }
    return { type: 'generated', names: await this.#walkChunks(indices()) }
  }

  /** @internal Worker side of `#splitWalk`: hands over the files, after generating its chunks again from `names` when given. */
  async emitRange({ names }: EmitRequest): Promise<EmittedResponse> {
    if (names) {
      for (const plugin of this.plugins.values()) {
        const state = names[plugin.name]
        if (state) plugin.resolver.names = state
      }
      await this.#walkChunks(this.#taken!.indices)
    }
    const { chunks, diagnostics, errors } = this.#taken!
    return { type: 'emitted', chunks, diagnostics, errors }
  }

  /** Generates `indices` from a clean slate, keeping each chunk's files in first-added order and its name events per plugin. */
  async #walkChunks(indices: Iterable<number>): Promise<GeneratedResponse['names']> {
    const taken = this.#taken!
    const plugins = [...this.plugins.values()]
    const names: GeneratedResponse['names'] = []
    taken.indices = []
    taken.chunks = []
    taken.diagnostics = []
    taken.errors = {}
    for (const state of taken.states) {
      state.error = null
      state.crashSite = undefined
      state.pluginOperations = []
    }
    // Only generator output goes back: the main thread already holds the files setup injected.
    this.fileManager.dispose()

    await Diagnostics.scope(
      (diagnostic) => taken.diagnostics.push(diagnostic),
      async () => {
        // Pulled one at a time, so a slow chunk on one thread leaves the rest to the others.
        for (const index of indices) {
          taken.indices.push(index)
          const { phase, range } = this.#chunk(index)
          for (const plugin of plugins) plugin.resolver.record()
          const walk = phase === 'schemas' ? this.#walkSchemas : this.#walkOperations
          await walk.call(this, taken.states, range, { dispatch: true, hooks: false })
          names.push({ index, names: Object.fromEntries(plugins.map((plugin) => [plugin.name, plugin.resolver.takeEvents()])) })
          taken.chunks.push({ index, files: this.fileManager.unsorted })
          this.fileManager.dispose()
        }
      },
    )

    for (const state of taken.states) {
      if (state.error) taken.errors[state.plugin.name] = this.#pluginDiagnostic(state)
    }
    return names
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
  }

  [Symbol.dispose](): void {
    this.dispose()
  }

  /** Reads `plugin.resolver`, falling back to a fresh default for a name that is not a registered plugin. */
  getResolver<TName extends PluginName>(pluginName: TName): ResolvePluginOptions<TName>['resolver']
  getResolver(pluginName: string): Resolver {
    return this.plugins.get(pluginName)?.resolver ?? createResolver<PluginType>({ pluginName })
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
