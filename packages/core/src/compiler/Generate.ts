import { forBatches, formatMs, getElapsedMs, isPromise } from '@internals/utils'
import { collectUsedSchemaNames } from '@kubb/ast'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import { SCHEMA_PARALLEL } from '../constants.ts'
import type { Renderer, RendererFactory } from '../createRenderer.ts'
import type { Generator } from '../defineGenerator.ts'
import type { Plugin } from '../definePlugin.ts'
import type { KubbDriver } from '../KubbDriver.ts'
import type { GeneratorContext, NormalizedPlugin } from '../types.ts'
import type { Transform } from './Transform.ts'

const OPERATION_FILTER_TYPES = new Set(['tag', 'operationId', 'path', 'method', 'contentType'])

type PluginEntry = {
  plugin: NormalizedPlugin
  context: Omit<GeneratorContext, 'options'>
  hrStart: ReturnType<typeof process.hrtime>
}

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

type GenerateRunParams = {
  driver: KubbDriver
  transforms: Transform
  entries: Array<PluginEntry>
  flushPending: () => Promise<void>
  emitPluginEnd: (params: { plugin: NormalizedPlugin; duration: number; success: boolean; error?: Error }) => Promise<void> | void
}

type GenerateRunResult = {
  timings: Map<string, number>
  failed: Set<{ plugin: Plugin; error: Error }>
}

type GenerateApplyParams<TElement> = {
  result: TElement | Array<FileNode> | undefined | null
  driver: KubbDriver
  rendererFactory?: RendererFactory<TElement> | null
}

async function applyAsyncRender<TElement>({ renderer, result, driver }: { renderer: Renderer<TElement>; result: TElement; driver: KubbDriver }): Promise<void> {
  using r = renderer
  await r.render(result)

  driver.fileManager.upsert(...r.files)
}

/**
 * Phase 3 of the pipeline. Streams schemas and operations through every plugin's generators
 * and applies each plugin's registered transformer (via `transforms`) on the way in. The hot
 * path stays per-node, with no buffering, and per-plugin isolation comes from routing through
 * `transforms.applyTo(name, node)`.
 */
export class Generate {
  /**
   * Routes the return value of a generator method or `kubb:generate:*` hook to the right sink.
   *
   * - An `Array<FileNode>` goes straight into `driver.fileManager` via `upsert`.
   * - A renderer element is rendered through `rendererFactory` (for example, the JSX renderer)
   *   and the produced files are passed to `driver.fileManager.upsert`.
   * - `null`, `undefined`, or any other false-y value is treated as a no-op. The generator is
   *   expected to have written files itself via `ctx.upsertFile`.
   *
   * Pass `rendererFactory` when the result may be a renderer element. Generators that only
   * return `Array<FileNode>` do not need one.
   */
  static apply<TElement = unknown>({ result, driver, rendererFactory }: GenerateApplyParams<TElement>): void | Promise<void> {
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

  /**
   * Drives the generate phase for every plugin in `entries`. Schemas run before operations so
   * the two passes do not race on the shared `flushPending` queue and the FileProcessor's
   * event emitter. Each plugin's generators see the transformed view of every node, filtered
   * by its own `include` / `exclude` / `override`. Errors from a single plugin are captured
   * into `failed` so the rest of the build continues.
   */
  static async run({ driver, transforms, entries, flushPending, emitPluginEnd }: GenerateRunParams): Promise<GenerateRunResult> {
    const timings = new Map<string, number>()
    const failed = new Set<{ plugin: Plugin; error: Error }>()
    const { schemas, operations } = driver.inputNode!

    const states: Array<PluginState> = entries.map(({ plugin, context, hrStart }) => {
      const { exclude, include, override } = plugin.options
      const hasExclude = Array.isArray(exclude) && exclude.length > 0
      const hasInclude = Array.isArray(include) && include.length > 0
      const hasOverride = Array.isArray(override) && override.length > 0
      return {
        plugin,
        generatorContext: { ...context, resolver: driver.getResolver(plugin.name) },
        generators: plugin.generators ?? [],
        hrStart,
        failed: false,
        error: null,
        optionsAreStatic: !hasExclude && !hasInclude && !hasOverride,
        allowedSchemaNames: null,
      }
    })

    const emitsSchemaHook = driver.hooks.listenerCount('kubb:generate:schema') > 0
    const emitsOperationHook = driver.hooks.listenerCount('kubb:generate:operation') > 0

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
        const transformedNode = transforms.applyTo(plugin.name, node)

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
          const run = gen[dispatch.method] as ((node: TNode, ctx: GeneratorContext) => unknown) | undefined
          if (!run) continue
          const raw = run(transformedNode, ctx)
          const result = isPromise(raw) ? await raw : raw
          const applied = Generate.apply({ result, driver, rendererFactory: resolveRendererFor(gen, state) })
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
      emit: emitsSchemaHook ? (node: SchemaNode, ctx: GeneratorContext) => driver.hooks.emit('kubb:generate:schema', node, ctx) : null,
    } as const
    const operationDispatch = {
      method: 'operation',
      checkAllowedNames: false,
      emit: emitsOperationHook ? (node: OperationNode, ctx: GeneratorContext) => driver.hooks.emit('kubb:generate:operation', node, ctx) : null,
    } as const

    // Skip building the aggregated operations array when nothing consumes it.
    // Saves an N-sized allocation that lives until the build ends, on the common
    // path where plugins only define per-node `gen.operation`.
    const needsCollectedOperations = driver.hooks.listenerCount('kubb:generate:operations') > 0 || states.some((s) => s.generators.some((g) => !!g.operations))
    const collectedOperations: Array<OperationNode> | undefined = needsCollectedOperations ? [] : undefined

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
        if (needsCollectedOperations) collectedOperations?.push(...nodes)
        return Promise.all(nodes.flatMap((n) => states.map((state) => dispatchNode(state, n, operationDispatch))))
      },
      { concurrency: SCHEMA_PARALLEL, flush: flushPending },
    )

    for (const state of states) {
      if (!state.failed && needsCollectedOperations) {
        try {
          const { plugin, generatorContext, generators } = state
          const ctx = { ...generatorContext, options: plugin.options }
          // Match what the per-node dispatch passes to gen.operation(): the transformed node,
          // already filtered by excludes/includes/overrides. Without the transform step the
          // batched gen.operations() hook would see a different shape than gen.operation()
          // for the same operation, which broke grouped/barrel generators that compare names.
          const ops = collectedOperations ?? []
          const transformedOps = ops.map((node) => transforms.applyTo(plugin.name, node))
          const pluginOperations = state.optionsAreStatic
            ? transformedOps
            : transformedOps.filter((node) => {
                const { exclude, include, override } = plugin.options
                return generatorContext.resolver.resolveOptions(node, { options: plugin.options, exclude, include, override }) !== null
              })
          for (const gen of generators) {
            if (!gen.operations) continue
            const result = await gen.operations(pluginOperations, ctx)
            await Generate.apply({ result, driver, rendererFactory: resolveRendererFor(gen, state) })
          }
          await driver.hooks.emit('kubb:generate:operations', pluginOperations, ctx)
        } catch (caughtError) {
          state.failed = true
          state.error = caughtError as Error
        }
      }

      const duration = getElapsedMs(state.hrStart)
      timings.set(state.plugin.name, duration)
      await emitPluginEnd({ plugin: state.plugin, duration, success: !state.failed, error: state.failed && state.error ? state.error : undefined })

      if (state.failed && state.error) failed.add({ plugin: state.plugin, error: state.error })

      await driver.hooks.emit('kubb:debug', {
        date: new Date(),
        logs: [state.failed ? '✗ Plugin start failed' : `✓ Plugin started successfully (${formatMs(duration)})`],
      })
    }

    return { timings, failed }
  }
}
