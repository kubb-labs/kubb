import { ast, type ImportNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import type { PluginName } from '@kubb/core'
import { type FileContext, resolveLocation, resolvePluginOptions, useFileContext } from './file.ts'
import { isNamespace, type Resolver } from './resolver/Resolver.ts'
import { providedResolver } from './composables.ts'
import type { ProvideName, ResolverFor } from './types.ts'

/**
 * A name from a plugin's resolver, with the import that brings it into scope. It prints as the name, so it works in a template string too.
 */
export type RefName = {
  readonly name: string
  /**
   * `null` when the first argument names no generated file: no node, an unknown schema name, or a node the plugin's rules leave out.
   */
  readonly import: ImportNode | null
  toString(): string
}

// Each string a member can return comes back as a `RefName`. Other results, such as `null`, keep their type.
export type RefResult<R> = R extends string ? RefName : R

// Only plain objects are wrapped, so arrays, Maps, Sets and class instances keep their type, as at runtime.
export type RefMember<T> = T extends (...args: infer A) => infer R
  ? [Extract<R, string>] extends [never]
    ? T
    : (...args: A) => RefResult<R>
  : T extends ReadonlyArray<unknown> | ReadonlyMap<unknown, unknown> | ReadonlySet<unknown> | Date | RegExp
    ? T
    : T extends object
      ? { [K in keyof T]: RefMember<T[K]> }
      : T

/**
 * A plugin's resolver whose name members return a `RefName` instead of a string.
 */
export type FromResolver<T extends Resolver = Resolver> = RefMember<Omit<T, keyof Resolver>> & {
  name(name: string): RefName
}

/**
 * What `from(source)` returns: the wrapped resolver, and `ref` for names that no resolver member returns.
 */
export type From<T extends Resolver = Resolver> = {
  resolver: FromResolver<T>
  /**
   * `name` with the import from the plugin's file for `node`, for a name that no resolver member returns.
   */
  ref(node: SchemaNode | OperationNode, name: string): RefName
}

/**
 * The resolver type `from(source)` wraps. Without `source`, it is `TCurrent`: `ctx.from` passes the current plugin's resolver, and the `from` composable cannot know it.
 */
export type SourceResolver<TSource, TCurrent extends Resolver = Resolver> = [TSource] extends [never] ? TCurrent : ResolverFor<TSource>

const skipped = new Set(['pluginName', 'default', 'fileName'])

// Only an identifier can be imported, so other strings a member returns, such as a description, get no import.
const identifier = /^[A-Za-z_$][\w$]*$/

// Resolver namespaces are plain objects. A Map, Set or class instance stays as it is.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
}

function toNode(ctx: FileContext, arg: unknown): SchemaNode | OperationNode | null {
  const schemas = ctx.memo('kit:from:schemas', () => new Map(ctx.schemas.flatMap((schema) => (schema.name ? [[schema.name, schema] as const] : []))))
  if (typeof arg === 'string') return schemas.get(arg) ?? null
  if (!isNamespace(arg)) return null
  if (arg.kind === 'Operation') return arg as unknown as OperationNode
  return (arg.kind === undefined || arg.kind === 'Schema') && typeof arg.name === 'string' ? (schemas.get(arg.name) ?? null) : null
}

/**
 * Another plugin's resolver, read from the current generator context, whose name members return the name plus the import from that plugin's file.
 * `source` is a plugin name, or a provided name such as `'types'` that reads the plugin that registers it with `provide()`. Without `source`, it wraps the current plugin's resolver. A `source` that is neither fails with `KUBB_PLUGIN_NOT_FOUND`. The first argument of a name member picks the file:
 * - an operation node: the plugin's file for that operation
 * - a schema node, `{ name }` or a schema name: the plugin's file for that schema, when the document has that schema
 *
 * The plugin's resolver decides the file's name through `file.name`, so callers pass only the node.
 * A node the plugin's `include` or `exclude` rules leave out gets no import.
 *
 * @example
 * `from('plugin-ts').resolver.name('Pet') // { name: 'Pet', import: { name: ['Pet'], path } }`
 */
export function from<TSource extends PluginName | ProvideName = never>(source?: TSource): From<SourceResolver<TSource>> {
  return resolveFrom(useFileContext('from'), source)
}

/**
 * `from` for an explicit context. Generators get it as `ctx.from`.
 */
export function resolveFrom<TSource extends PluginName | ProvideName = never>(ctx: FileContext, source?: TSource): From<SourceResolver<TSource>> {
  const provided = source === undefined ? undefined : providedResolver(source, ctx.memo)
  // A source nothing provides must be a plugin in the config, so a missing one fails here with `KUBB_PLUGIN_NOT_FOUND`.
  if (source !== undefined && !provided) ctx.requirePlugin(source as PluginName)
  const resolver = (provided ?? ctx.getResolver((source ?? ctx.plugin.name) as PluginName)) as Resolver & Record<string, unknown>
  const pluginName = (provided ? resolver.pluginName : (source ?? ctx.plugin.name)) as PluginName
  const toRefName = (name: string, node: SchemaNode | OperationNode | null): RefName => {
    const nodeOptions = node && resolvePluginOptions({ ctx, node, plugin: pluginName })
    if (!node || !nodeOptions) return { name, import: null, toString: () => name }
    const { path } = resolveLocation({ ctx, node, options: { plugin: pluginName, exportName: name }, pluginOptions: nodeOptions, resolver }).file
    return { name, import: ast.factory.createImport({ names: [{ name, space: 'value' }], path }), toString: () => name }
  }
  const wrapValue = (value: unknown, self: object): unknown => {
    if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, member]) => [key, wrapValue(member, value)]))
    if (typeof value !== 'function') return value
    return (...args: Array<unknown>) => {
      const result = value.apply(self, args)
      if (typeof result !== 'string') return result
      return toRefName(result, identifier.test(result) ? toNode(ctx, args[0]) : null)
    }
  }

  const wrapped: Record<string, unknown> = {
    ...Object.fromEntries(Object.entries(resolver).flatMap(([key, value]) => (skipped.has(key) ? [] : [[key, wrapValue(value, resolver)]]))),
    name: (name: string) => toRefName(resolver.name(name), toNode(ctx, name)),
  }
  return {
    resolver: wrapped as FromResolver<SourceResolver<TSource>>,
    ref: (node, name) => toRefName(name, node),
  }
}
