import { toError } from '@internals/utils'
import { ast, type Macro, type OperationNode, type SchemaNode } from '@kubb/ast'
import type { Generator, GeneratorContext, NormalizedPlugin, PluginVisitContext, PluginVisitHooks } from '@kubb/core'
import { slot } from './composables.ts'

const OPERATION_FILTER_TYPES: ReadonlySet<string> = new Set(['tag', 'operationId', 'path', 'method', 'contentType', 'extension'])

type Resolved<TNode> = { transformedNode: TNode; options: NormalizedPlugin['options'] }

type VisitState = {
  macros: Array<Macro>
  schemaGenerators: Array<Generator>
  operationGenerators: Array<Generator>
  operationsGenerators: Array<Generator>
  schemas: Map<SchemaNode, Resolved<SchemaNode> | Error>
  operations: Array<OperationNode>
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
function resolveNode<TNode extends SchemaNode | OperationNode>(ctx: PluginVisitContext, macros: Array<Macro>, node: TNode): Resolved<TNode> | null {
  const transformedNode = ast.macro.apply(node, macros)
  const options = pluginOptions(ctx)
  const { exclude, include, override } = options
  if (!exclude?.length && !include?.length && !override?.length) return { transformedNode, options }

  const resolved = ctx.resolver.default.options<NormalizedPlugin['options']>(transformedNode, { options, exclude, include, override })
  return resolved === null ? null : { transformedNode, options: resolved }
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
 * Visit hooks that run a plugin's generators, macros and filters from memo, the way core's driver
 * runs `plugin.generators`. Kit's `defineExtension` adds them to every plugin.
 */
export function generatorVisitor(): Required<PluginVisitHooks> {
  return {
    'kubb:plugin:visit:start'(ctx) {
      const { name } = ctx.plugin
      const generators = (ctx.memo.get(slot.generators(name)) as Array<Generator> | undefined) ?? []
      if (!generators.length) return

      const state: VisitState = {
        macros: (ctx.memo.get(slot.macros(name)) as Array<Macro> | undefined) ?? [],
        schemaGenerators: generators.filter((generator) => generator.schema),
        operationGenerators: generators.filter((generator) => generator.operation),
        operationsGenerators: generators.filter((generator) => generator.operations),
        schemas: new Map(),
        operations: [],
      }
      ctx.memo.set(stateKey(name), state)
      ctx.resolver.setTags(ctx.meta.tags)

      if (!state.schemaGenerators.length) return

      // An operation-based include without a schemaName include keeps only the schemas those operations use.
      const { include } = pluginOptions(ctx)
      let allowed: Set<string> | null = null
      if (include?.some(({ type }) => OPERATION_FILTER_TYPES.has(type)) && !include.some(({ type }) => type === 'schemaName')) {
        const operations = ctx.operations.filter((operation) => resolveNode(ctx, [], operation) !== null)
        allowed = ast.graph.getUsedNames(operations, ctx.schemas)
      }

      // Reserve names before generation, with the same macros and filters, so later collisions get suffixes.
      for (const node of ctx.schemas) {
        try {
          const resolved = resolveNode(ctx, state.macros, node)
          if (!resolved) continue
          const schemaName = resolved.transformedNode.name
          if (allowed && schemaName && !allowed.has(schemaName)) continue
          state.schemas.set(node, resolved)
          if (schemaName) ctx.resolver.reserveNames([ctx.resolver.name(schemaName)])
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
      const generatorContext = { ...ctx, options }
      await dispatch(state.schemaGenerators, transformedNode, generatorContext, (generator) => generator.schema!(transformedNode, generatorContext))
      await ctx.hooks.callHook('kubb:generate:schema', transformedNode, generatorContext)
    },
    async 'kubb:plugin:visit:operation'(node, ctx) {
      const state = getState(ctx)
      if (!state || (!state.operationGenerators.length && !state.operationsGenerators.length)) return
      const resolved = resolveNode(ctx, state.macros, node)
      if (!resolved) return

      state.operations.push(resolved.transformedNode)
      if (!state.operationGenerators.length) return

      const { transformedNode, options } = resolved
      const generatorContext = { ...ctx, options }
      await dispatch(state.operationGenerators, transformedNode, generatorContext, (generator) => generator.operation!(transformedNode, generatorContext))
      await ctx.hooks.callHook('kubb:generate:operation', transformedNode, generatorContext)
    },
    async 'kubb:plugin:visit:end'(ctx) {
      const state = getState(ctx)
      if (!state?.operationsGenerators.length) return

      const generatorContext = { ...ctx, options: pluginOptions(ctx) }
      for (const generator of state.operationsGenerators) {
        await ctx.dispatch({ result: await generator.operations!(state.operations, generatorContext), renderer: generator.renderer })
      }
      await ctx.hooks.callHook('kubb:generate:operations', state.operations, generatorContext)
    },
  }
}
