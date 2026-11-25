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
  // Names the walk leaves out: schemas only an excluded schema references.
  orphaned: ReadonlySet<string>
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

// An operation-based include without a schemaName include keeps only the schemas those operations use.
function operationSchemaNames(ctx: PluginVisitContext, resolver: Resolver): Set<string> | null {
  const { include } = pluginOptions(ctx)
  if (!include?.some(({ type }) => OPERATION_FILTER_TYPES.has(type)) || include.some(({ type }) => type === 'schemaName')) return null
  const operations = ctx.operations.filter((operation) => resolveNode(ctx, resolver, [], operation) !== null)
  return ast.graph.getUsedNames(operations, ctx.schemas)
}

// A schemaName exclude also drops the schemas only the excluded schemas reference.
function orphanedSchemaNames(ctx: PluginVisitContext, resolver: Resolver): Set<string> {
  const options = pluginOptions(ctx)
  const exclude = options.exclude?.filter(({ type }) => type === 'schemaName') ?? []
  // The filter list is also the cache key, so these results stay apart from the plugin's own.
  const excluded = new Set(ctx.schemas.filter((node) => exclude.length && resolver.default.options(node, { options: exclude, exclude }) === null))
  if (!excluded.size) return new Set()

  const kept = ctx.schemas.filter((node) => !excluded.has(node))
  const candidates = ast.graph.getUsedNames([...excluded], kept)
  const operations = ctx.operations.filter((operation) => resolveNode(ctx, resolver, [], operation) !== null)
  const roots = kept.filter((node) => !node.name || !candidates.has(node.name))
  const used = ast.graph.getUsedNames([...operations, ...roots], kept)
  return new Set([...candidates].filter((name) => !used.has(name)))
}

// Keeps a schema the rules allow and reserves its name. Returns its node after macros, or null when the rules leave it out.
function retainSchema(
  ctx: PluginVisitContext,
  state: VisitState,
  node: SchemaNode,
  { skipInclude, allowed }: { skipInclude?: boolean; allowed?: Set<string> | null } = {},
): SchemaNode | null {
  if (node.name && state.orphaned.has(node.name)) return null
  const { resolver } = state.context
  const resolved = resolveNode(ctx, resolver, state.macros, node, { skipInclude })
  if (!resolved) return null
  const schemaName = resolved.transformedNode.name
  if (allowed && schemaName && !allowed.has(schemaName)) return null
  state.schemas.set(node, resolved)
  if (schemaName) resolver.reserveNames([resolver.name(schemaName)])
  return resolved.transformedNode
}

// A schemaName include also keeps the schemas the matched schemas reference, so their imports resolve.
// References are read after the macros run, since a macro can add one.
function keepReferenced(ctx: PluginVisitContext, state: VisitState): void {
  if (!pluginOptions(ctx).include?.some(({ type }) => type === 'schemaName')) return
  const byName = new Map(ctx.schemas.flatMap((node) => (node.name ? [[node.name, node] as const] : [])))
  const seen = new Set([...state.schemas.keys()].map((node) => node.name))
  const queue = [...state.schemas.values()].flatMap((resolved) => (resolved instanceof Error ? [] : [resolved.transformedNode]))

  // The queue grows while it is read, so the schemas kept here are followed too.
  for (const current of queue) {
    for (const name of ast.graph.getRefNames(current)) {
      const node = byName.get(name)
      if (!node || seen.has(name)) continue
      seen.add(name)
      try {
        const kept = retainSchema(ctx, state, node, { skipInclude: true })
        if (kept) queue.push(kept)
      } catch (caughtError) {
        state.schemas.set(node, toError(caughtError))
        return
      }
    }
  }
}

// A schemaName override also applies to the schemas the matched schemas reference, unless they match an override themselves.
function inheritOverrides(ctx: PluginVisitContext, state: VisitState): void {
  const base = pluginOptions(ctx)
  if (!base.override?.some(({ type }) => type === 'schemaName')) return
  const byName = new Map<string, Resolved<SchemaNode>>()
  for (const [node, resolved] of state.schemas) {
    if (node.name && !(resolved instanceof Error)) byName.set(node.name, resolved)
  }

  // The queue grows while it is read, so an inherited override is passed on too.
  const queue = [...byName.values()].filter((resolved) => resolved.options !== base)
  for (const { transformedNode, options } of queue) {
    for (const name of ast.graph.getRefNames(transformedNode)) {
      const target = byName.get(name)
      if (!target || target.options !== base) continue
      target.options = options
      queue.push(target)
    }
  }
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
        orphaned: new Set(),
        operations: [],
        printerFactory: ctx.memo.get(slot.printer(name)) as VisitState['printerFactory'],
        printers: new WeakMap(),
      }
      ctx.memo.set(stateKey(name), state)

      if (!state.templates.Schema.length) return

      // Reserve names before generation, with the same macros and filters, so later collisions get suffixes.
      state.orphaned = orphanedSchemaNames(ctx, resolver)
      const allowed = operationSchemaNames(ctx, resolver)
      for (const node of ctx.schemas) {
        try {
          retainSchema(ctx, state, node, { allowed })
        } catch (caughtError) {
          // Reported at this node's turn, so the output of earlier schemas stays.
          state.schemas.set(node, toError(caughtError))
          return
        }
      }

      keepReferenced(ctx, state)
      inheritOverrides(ctx, state)
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
