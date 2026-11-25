import { memo, toError } from '@internals/utils'
import { ast, type Macro, type OperationNode, type SchemaNode } from '@kubb/ast'
import { type NormalizedPlugin, type PluginVisitContext, type PluginVisitHooks, withContext } from '@kubb/core'
import { jsxRenderer } from '@kubb/renderer-jsx'
import { isKubbElement } from '@kubb/renderer-jsx/jsx-runtime'
import { getResolver, type RegisteredTemplate, slot } from './composables.ts'
import { resolveFile } from './file.ts'
import { resolveFrom } from './from.ts'
import type { Resolver } from './resolver/Resolver.ts'
import type { GeneratorContext, PrinterContext, PrinterFactory, TemplateKind, TemplateNode } from './types.ts'

const OPERATION_FILTER_TYPES: ReadonlySet<string> = new Set(['tag', 'operationId', 'path', 'method', 'contentType', 'extension'])

type Resolved<TNode> = { transformedNode: TNode; options: NormalizedPlugin['options'] }

type VisitState = {
  // The resolver is fixed for the whole walk, so reservations and templates agree on names.
  context: Omit<PrinterContext, 'options'> & { resolver: Resolver }
  macros: Array<Macro>
  // One list per kind, so the walk skips the work for a kind no template writes.
  templates: Record<TemplateKind, Array<RegisteredTemplate>>
  schemas: Map<SchemaNode, Resolved<SchemaNode> | Error>
  operations: Array<OperationNode>
  printerFactory: PrinterFactory | undefined
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
  { skipInclude = false }: { skipInclude?: boolean } = {},
): Resolved<TNode> | null {
  const transformedNode = ast.macro.apply(node, macros)
  const options = pluginOptions(ctx)
  const { exclude, override } = options
  const include = skipInclude ? undefined : options.include
  if (!exclude?.length && !include?.length && !override?.length) return { transformedNode, options }

  const resolved = resolver.default.options<NormalizedPlugin['options']>(transformedNode, { options, exclude, include, override })
  return resolved === null ? null : { transformedNode, options: resolved }
}

// Runs a template's `render` with `ctx` as `this`, as its context argument and as `useKubb()`.
function run<TArgs extends Array<unknown>, TResult>(ctx: object, fn: (...args: TArgs) => TResult, ...args: TArgs): TResult {
  return withContext(ctx, () => fn.apply(ctx, args))
}

function withPrinter(state: VisitState, ctx: PrinterContext): GeneratorContext {
  const generatorContext: GeneratorContext = {
    ...ctx,
    printer: undefined,
    file: (node, options) => resolveFile(generatorContext, node, options),
    from: (source) => resolveFrom(generatorContext, source),
  }
  const { printerFactory, printers } = state
  if (!printerFactory) return generatorContext

  generatorContext.printer = memo(printers, ctx.options as object, () => withContext(ctx, printerFactory))
  return generatorContext
}

// An unset `renderer` renders JSX elements with `jsxRenderer`. `null` keeps a template on files only.
async function render(templates: Array<RegisteredTemplate>, node: TemplateNode[TemplateKind], ctx: GeneratorContext, pointer?: string): Promise<void> {
  for (const template of templates) {
    const result = await run(ctx, template.render, node, ctx)
    const renderer = template.renderer !== undefined ? template.renderer : isKubbElement(result) ? jsxRenderer : null
    if (result && !Array.isArray(result) && (result as { kind?: unknown }).kind !== ast.node.kinds.file && !renderer) {
      ctx.warn(`"${template.name}" returned a value without a renderer to write it, so it wrote nothing.`, {
        help: 'Return a `FileNode` or `Array<FileNode>`, or return JSX and leave `renderer` unset.',
      })
    }
    await ctx.dispatch({ result, renderer, pointer })
  }
}

/**
 * Visit hooks that run a plugin's templates, macros and filters from memo. Kit's `defineExtension`
 * adds them to every plugin.
 */
export function generatorVisitor(): Required<PluginVisitHooks> {
  return {
    'kubb:plugin:visit:start'(ctx) {
      const { name } = ctx.plugin
      const resolver = getResolver(name, ctx.memo)
      resolver.setTags(ctx.meta.tags)
      const templates = (ctx.memo.get(slot.templates(name)) as Array<RegisteredTemplate> | undefined) ?? []
      if (!templates.length) return
      const ofKind = (kind: TemplateKind) => templates.filter((template) => template.kind === kind)

      const state: VisitState = {
        context: { ...ctx, resolver, getResolver: ((pluginName: string) => getResolver(pluginName, ctx.memo)) as VisitState['context']['getResolver'] },
        macros: (ctx.memo.get(slot.macros(name)) as Array<Macro> | undefined) ?? [],
        templates: { Schema: ofKind('Schema'), Operation: ofKind('Operation'), Operations: ofKind('Operations') },
        schemas: new Map(),
        operations: [],
        printerFactory: ctx.memo.get(slot.printer(name)) as VisitState['printerFactory'],
        printers: new WeakMap(),
      }
      ctx.memo.set(stateKey(name), state)

      if (!state.templates.Schema.length) return

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
          return
        }
      }

      // A schemaName include also keeps the schemas its matches reference, so their imports resolve.
      if (!include?.some(({ type }) => type === 'schemaName')) return
      const referenced = ast.graph.getUsedNames([...state.schemas.keys()], ctx.schemas)
      for (const node of ctx.schemas) {
        if (state.schemas.has(node) || !node.name || !referenced.has(node.name)) continue
        try {
          const resolved = resolveNode(ctx, resolver, state.macros, node, { skipInclude: true })
          if (!resolved) continue
          state.schemas.set(node, resolved)
          const schemaName = resolved.transformedNode.name
          if (schemaName) resolver.reserveNames([resolver.name(schemaName)])
        } catch (caughtError) {
          state.schemas.set(node, toError(caughtError))
          return
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
      await render(state.templates.Schema, transformedNode, generatorContext, transformedNode.pointer)
      await withContext(generatorContext, () => ctx.hooks.callHook('kubb:generate:schema', transformedNode, generatorContext))
    },
    async 'kubb:plugin:visit:operation'(node, ctx) {
      const state = getState(ctx)
      if (!state || (!state.templates.Operation.length && !state.templates.Operations.length)) return
      const resolved = resolveNode(ctx, state.context.resolver, state.macros, node)
      if (!resolved) return

      state.operations.push(resolved.transformedNode)
      if (!state.templates.Operation.length) return

      const { transformedNode, options } = resolved
      const generatorContext = withPrinter(state, { ...state.context, options })
      await render(state.templates.Operation, transformedNode, generatorContext, transformedNode.pointer)
      await withContext(generatorContext, () => ctx.hooks.callHook('kubb:generate:operation', transformedNode, generatorContext))
    },
    async 'kubb:plugin:visit:end'(ctx) {
      const state = getState(ctx)
      if (!state?.templates.Operations.length) return

      const generatorContext = withPrinter(state, { ...state.context, options: pluginOptions(ctx) })
      await render(state.templates.Operations, ast.factory.createOperations({ operations: state.operations }), generatorContext)
      await withContext(generatorContext, () => ctx.hooks.callHook('kubb:generate:operations', state.operations, generatorContext))
    },
  }
}
