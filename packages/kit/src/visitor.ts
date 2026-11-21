import { toError } from '@internals/utils'
import { ast, type Macro, type OperationNode, type SchemaNode } from '@kubb/ast'
import type { NormalizedPlugin, PluginVisitContext, PluginVisitHooks } from '@kubb/core'
import { resolverFor, slot } from './composables.ts'
import type { Resolver } from './resolver/Resolver.ts'
import type { Generator, GeneratorContext } from './types.ts'

const OPERATION_FILTER_TYPES: ReadonlySet<string> = new Set(['tag', 'operationId', 'path', 'method', 'contentType', 'extension'])

type Resolved<TNode> = { transformedNode: TNode; options: NormalizedPlugin['options'] }

type VisitState = {
  // The resolver is fixed for the whole walk, so reservations and generators agree on names.
  context: Omit<GeneratorContext, 'options' | 'printer'> & { resolver: Resolver }
  macros: Array<Macro>
  schemaGenerators: Array<Generator>
  operationGenerators: Array<Generator>
  operationsGenerators: Array<Generator>
  schemas: Map<SchemaNode, Resolved<SchemaNode> | Error>
  operations: Array<OperationNode>
  printerFactory: ((ctx: GeneratorContext) => unknown) | undefined
  // Override merges are stable objects, so one printer per base options and per matching override.
  printers: WeakMap<object, unknown>
}

const stateKey = (name: string) => `${name}:visit`

// The driver hands visit hooks the normalized plugin, so its options are filled in.
function pluginOptions(ctx: PluginVisitContext): NormalizedPlugin['options'] {
  return (ctx.plugin as NormalizedPlugin).options
}

function getState(ctx: PluginVisitContext): VisitState | undefined {
  return ctx.memo.get(stateKey(ctx.plugin.name)) as VisitState | undefined
}

// Applies the plugin's macros, then its include, exclude and override rules. Returns null for a node the rules leave out.
function resolveNode<TNode extends SchemaNode | OperationNode>(
  ctx: PluginVisitContext,
  resolver: Resolver,
  macros: Array<Macro>,
  node: TNode,
): Resolved<TNode> | null {
  const transformedNode = ast.macro.apply(node, macros)
  const options = pluginOptions(ctx)
  const { exclude, include, override } = options
  if (!exclude?.length && !include?.length && !override?.length) return { transformedNode, options }

  const resolved = resolver.default.options<NormalizedPlugin['options']>(transformedNode, { options, exclude, include, override })
  return resolved === null ? null : { transformedNode, options: resolved }
}

// Adds the plugin's printer to a generator context.
function withPrinter(state: VisitState, ctx: Omit<GeneratorContext, 'printer'>): GeneratorContext {
  const generatorContext: GeneratorContext = { ...ctx, printer: undefined }
  const { printerFactory, printers } = state
  if (!printerFactory) return generatorContext

  const key = ctx.options as object
  if (!printers.has(key)) printers.set(key, printerFactory(generatorContext))
  generatorContext.printer = printers.get(key)
  return generatorContext
}

async function dispatch(
  generators: Array<Generator>,
  node: SchemaNode | OperationNode,
  ctx: GeneratorContext,
  generate: (generator: Generator) => ReturnType<NonNullable<Generator['schema']>>,
): Promise<void> {
  for (const generator of generators) {
    const matches = generator.match ? await generator.match(node, ctx) : true
    if (!matches) continue
    await ctx.dispatch({ result: await generate(generator), renderer: generator.renderer, pointer: node.pointer })
  }
}

/**
 * Visit hooks that run a plugin's generators, macros and filters from memo. Kit's `defineExtension`
 * adds them to every plugin.
 */
export function generatorVisitor(): Required<PluginVisitHooks> {
  return {
    'kubb:plugin:visit:start'(ctx) {
      const { name } = ctx.plugin
      const resolver = resolverFor(ctx.memo, name)
      resolver.setTags(ctx.meta.tags)
      const generators = (ctx.memo.get(slot.generators(name)) as Array<Generator> | undefined) ?? []
      if (!generators.length) return

      const getResolver = ((pluginName: string) => resolverFor(ctx.memo, pluginName)) as VisitState['context']['getResolver']
      const state: VisitState = {
        context: { ...ctx, resolver, getResolver },
        macros: (ctx.memo.get(slot.macros(name)) as Array<Macro> | undefined) ?? [],
        schemaGenerators: generators.filter((generator) => generator.schema),
        operationGenerators: generators.filter((generator) => generator.operation),
        operationsGenerators: generators.filter((generator) => generator.operations),
        schemas: new Map(),
        operations: [],
        printerFactory: ctx.memo.get(slot.printer(name)) as VisitState['printerFactory'],
        printers: new WeakMap(),
      }
      ctx.memo.set(stateKey(name), state)

      if (!state.schemaGenerators.length) return

      // An operation-based include without a schemaName include keeps only the schemas those operations use.
      const { include } = pluginOptions(ctx)
      let allowed: Set<string> | null = null
      if (include?.some(({ type }) => OPERATION_FILTER_TYPES.has(type)) && !include.some(({ type }) => type === 'schemaName')) {
        const operations = ctx.operations.filter((operation) => resolveNode(ctx, resolver, [], operation) !== null)
        allowed = ast.graph.getUsedNames(operations, ctx.schemas)
      }

      // Reserve names before generation, with the same macros and filters, so later collisions get suffixes.
      for (const node of ctx.schemas) {
        try {
          const resolved = resolveNode(ctx, resolver, state.macros, node)
          if (!resolved) continue
          const schemaName = resolved.transformedNode.name
          if (allowed && schemaName && !allowed.has(schemaName)) continue
          state.schemas.set(node, resolved)
          if (schemaName) resolver.reserveNames([resolver.name(schemaName)])
        } catch (caughtError) {
          // Reported at this node's turn, so the output of earlier schemas stays.
          state.schemas.set(node, toError(caughtError))
          break
        }
      }
    },
    async 'kubb:plugin:visit:schema'(node, ctx) {
      const state = getState(ctx)
      const resolved = state?.schemas.get(node)
      if (resolved instanceof Error) throw resolved
      if (!state || !resolved) return

      const { transformedNode, options } = resolved
      const generatorContext = withPrinter(state, { ...state.context, options })
      await dispatch(state.schemaGenerators, transformedNode, generatorContext, (generator) => generator.schema!(transformedNode, generatorContext))
      await ctx.hooks.callHook('kubb:generate:schema', transformedNode, generatorContext)
    },
    async 'kubb:plugin:visit:operation'(node, ctx) {
      const state = getState(ctx)
      if (!state || (!state.operationGenerators.length && !state.operationsGenerators.length)) return
      const resolved = resolveNode(ctx, state.context.resolver, state.macros, node)
      if (!resolved) return

      state.operations.push(resolved.transformedNode)
      if (!state.operationGenerators.length) return

      const { transformedNode, options } = resolved
      const generatorContext = withPrinter(state, { ...state.context, options })
      await dispatch(state.operationGenerators, transformedNode, generatorContext, (generator) => generator.operation!(transformedNode, generatorContext))
      await ctx.hooks.callHook('kubb:generate:operation', transformedNode, generatorContext)
    },
    async 'kubb:plugin:visit:end'(ctx) {
      const state = getState(ctx)
      if (!state?.operationsGenerators.length) return

      const generatorContext = withPrinter(state, { ...state.context, options: pluginOptions(ctx) })
      for (const generator of state.operationsGenerators) {
        await ctx.dispatch({ result: await generator.operations!(state.operations, generatorContext), renderer: generator.renderer })
      }
      await ctx.hooks.callHook('kubb:generate:operations', state.operations, generatorContext)
    },
  }
}
