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
const NO_NAMES: ReadonlySet<string> = new Set()

type Resolved<TNode> = { transformedNode: TNode; options: NormalizedPlugin['options'] }

type VisitState = {
  // The resolver is fixed for the whole walk, so reservations and templates agree on names.
  context: Omit<PrinterContext, 'options'> & { resolver: Resolver }
  macros: Array<Macro>
  // One list per kind, so the walk skips the work for a kind no template writes.
  templates: Record<TemplateKind, Array<RegisteredTemplate>>
  schemas: Map<SchemaNode, Resolved<SchemaNode> | Error>
  // Names the walk leaves out before a rule runs.
  skipped: ReadonlySet<string>
  // Set by the first schema that throws. Later schemas are skipped.
  failed: boolean
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

function isEmpty(filters: ReadonlyArray<unknown> | undefined): boolean {
  return !filters?.length
}

// Applies the plugin's macros, then its include, exclude and override rules. Returns null for a node the rules leave out.
function resolveNode<TNode extends SchemaNode | OperationNode>(
  ctx: PluginVisitContext,
  resolver: Resolver,
  macros: Array<Macro>,
  node: TNode,
  skip?: { skipInclude?: boolean },
): Resolved<TNode> | null {
  const transformedNode = ast.macro.apply(node, macros)
  const options = pluginOptions(ctx)
  const { exclude, override } = options
  const include = skip?.skipInclude ? undefined : options.include
  if (isEmpty(exclude) && isEmpty(include) && isEmpty(override)) return { transformedNode, options }

  const resolved = resolver.default.options<NormalizedPlugin['options']>(transformedNode, { options, exclude, include, override })
  return resolved === null ? null : { transformedNode, options: resolved }
}

function hasSchemaName(filters: ReadonlyArray<{ type: string }> | undefined): boolean {
  return filters?.some(({ type }) => type === 'schemaName') ?? false
}

function keptOperations(ctx: PluginVisitContext, resolver: Resolver): Array<OperationNode> {
  return ctx.operations.filter((operation) => resolveNode(ctx, resolver, [], operation) !== null)
}

// A schemaName exclude also drops the schemas only the excluded schemas reference.
function unusedSchemaNames(ctx: PluginVisitContext, resolver: Resolver, operations: Array<OperationNode>): Set<string> {
  const exclude = pluginOptions(ctx).exclude?.filter(({ type }) => type === 'schemaName') ?? []
  const excluded: Array<SchemaNode> = []
  const kept: Array<SchemaNode> = []
  for (const node of ctx.schemas) {
    // The filter list is also the cache key, so these results stay apart from the plugin's own.
    const isExcluded = resolver.default.options(node, { options: exclude, exclude }) === null
    ;(isExcluded ? excluded : kept).push(node)
  }

  const unused = ast.graph.getUsedNames(excluded, kept)
  if (!unused.size) return unused
  const roots: Array<OperationNode | SchemaNode> = [...operations]
  for (const node of kept) {
    if (!node.name || !unused.has(node.name)) roots.push(node)
  }
  for (const name of ast.graph.getUsedNames(roots, kept)) unused.delete(name)
  return unused
}

// Names the walk leaves out: schemas only an excluded schema uses, and schemas an operation-based include does not use.
function skippedSchemaNames(ctx: PluginVisitContext, resolver: Resolver): ReadonlySet<string> {
  const { include, exclude } = pluginOptions(ctx)
  const byExclude = hasSchemaName(exclude)
  const byOperation = !hasSchemaName(include) && include?.some(({ type }) => OPERATION_FILTER_TYPES.has(type))
  // Most configs set neither, and then no schema or operation is read here.
  if (!byExclude && !byOperation) return NO_NAMES

  const operations = keptOperations(ctx, resolver)
  const skipped = byExclude ? unusedSchemaNames(ctx, resolver, operations) : new Set<string>()
  if (!byOperation) return skipped
  const used = ast.graph.getUsedNames(operations, ctx.schemas)
  for (const { name } of ctx.schemas) {
    if (name && !used.has(name)) skipped.add(name)
  }
  return skipped
}

// Keeps a schema the rules allow and reserves its name. Returns null when the rules leave it out.
function retainSchema(ctx: PluginVisitContext, state: VisitState, node: SchemaNode, skip?: { skipInclude?: boolean }): Resolved<SchemaNode> | null {
  if (state.failed) return null
  const { resolver } = state.context
  try {
    // Macros run for a skipped schema too, so every plugin sees the same macro calls.
    const resolved = resolveNode(ctx, resolver, state.macros, node, skip)
    const schemaName = resolved?.transformedNode.name
    if (!resolved || state.skipped.has(schemaName ?? '')) return null
    state.schemas.set(node, resolved)
    if (schemaName) resolver.reserveNames([resolver.name(schemaName)])
    return resolved
  } catch (caughtError) {
    // Reported at this node's turn, so the output of earlier schemas stays.
    state.schemas.set(node, toError(caughtError))
    state.failed = true
    return null
  }
}

// Calls `visit` for each reference of each schema, read after its macros ran. A schema added to `schemas` meanwhile is walked too.
function followReferences(schemas: Iterable<Resolved<SchemaNode>>, visit: (name: string, from: Resolved<SchemaNode>) => void): void {
  for (const from of schemas) {
    for (const name of ast.graph.getRefNames(from.transformedNode)) visit(name, from)
  }
}

// A schemaName include also keeps the schemas the matched schemas reference, so their imports resolve.
function keepReferenced(ctx: PluginVisitContext, state: VisitState, kept: Map<string, Resolved<SchemaNode>>): void {
  const inSpec = new Map<string, SchemaNode>()
  for (const node of ctx.schemas) {
    if (node.name) inSpec.set(node.name, node)
  }

  const rejected = new Set<string>()
  followReferences(kept.values(), (name) => {
    if (kept.has(name) || rejected.has(name)) return
    const node = inSpec.get(name)
    const resolved = node ? retainSchema(ctx, state, node, { skipInclude: true }) : null
    if (resolved) kept.set(name, resolved)
    else rejected.add(name)
  })
}

// A schemaName override also applies to the schemas the matched schemas reference, unless they match an override themselves.
function inheritOverrides(base: NormalizedPlugin['options'], kept: Map<string, Resolved<SchemaNode>>): void {
  const overridden: Array<Resolved<SchemaNode>> = []
  for (const resolved of kept.values()) {
    if (resolved.options !== base) overridden.push(resolved)
  }

  followReferences(overridden, (name, from) => {
    const target = kept.get(name)
    if (!target || target.options !== base) return
    target.options = from.options
    overridden.push(target)
  })
}

// Applies the schemaName rules that read schema references, once the walk kept its schemas.
function followSchemaNameRules(ctx: PluginVisitContext, state: VisitState): void {
  const options = pluginOptions(ctx)
  const keeps = hasSchemaName(options.include)
  const inherits = hasSchemaName(options.override)
  if (!keeps && !inherits) return

  const kept = new Map<string, Resolved<SchemaNode>>()
  for (const [node, resolved] of state.schemas) {
    if (node.name && !(resolved instanceof Error)) kept.set(node.name, resolved)
  }
  if (keeps) keepReferenced(ctx, state, kept)
  if (inherits) inheritOverrides(options, kept)
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
        skipped: NO_NAMES,
        failed: false,
        operations: [],
        printerFactory: ctx.memo.get(slot.printer(name)) as VisitState['printerFactory'],
        printers: new WeakMap(),
      }
      ctx.memo.set(stateKey(name), state)

      if (!state.templates.Schema.length) return

      // Reserve names before generation, with the same macros and filters, so later collisions get suffixes.
      state.skipped = skippedSchemaNames(ctx, resolver)
      for (const node of ctx.schemas) retainSchema(ctx, state, node)

      followSchemaNameRules(ctx, state)
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
