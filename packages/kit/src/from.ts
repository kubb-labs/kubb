import { ast, type ImportNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import type { PluginName } from '@kubb/core'
import { type FileContext, locateFile, pluginOptionsFor, useFileContext } from './file.ts'
import type { Resolver } from './resolver/Resolver.ts'
import { type Provided, slot } from './composables.ts'
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
type RefResult<R> = R extends string ? RefName : R

// Only plain objects are wrapped, so arrays, Maps, Sets and class instances keep their type, as at runtime.
type RefMember<T> = T extends (...args: infer A) => infer R
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

export type From<T extends Resolver = Resolver> = {
  resolver: FromResolver<T>
  /** `false` when the plugin's `include` or `exclude` rules leave `node` out. */
  has(node: SchemaNode | OperationNode): boolean
  /** `name` with the import from the plugin's file for `node`, for a name that no resolver member returns. */
  import(node: SchemaNode | OperationNode, name: string): RefName
}

// No `source` reads the current plugin, whose resolver type is not known statically.
type SourceResolver<TSource> = [TSource] extends [never] ? Resolver : ResolverFor<TSource>

const skipped = new Set(['pluginName', 'default', 'fileName'])

function isNamespace(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

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
 * `source` is a plugin name, or a provided name such as `'types'` that reads whichever plugin `provide()`s it. Without `source`, it wraps the current plugin's resolver. The first argument of a name member picks the file:
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
  const ctx = useFileContext('from')
  const provided = source === undefined ? undefined : (ctx.memo.get(slot.provided(source)) as Provided | undefined)
  const resolver = (provided ? provided.factory() : ctx.getResolver((source ?? ctx.plugin.name) as PluginName)) as Resolver & Record<string, unknown>
  const pluginName = (provided ? resolver.pluginName : (source ?? ctx.plugin.name)) as PluginName
  const toRefName = (name: string, node: SchemaNode | OperationNode | null): RefName => {
    const nodeOptions = node && pluginOptionsFor({ ctx, node, plugin: pluginName })
    if (!node || !nodeOptions) return { name, import: null, toString: () => name }
    const { path } = locateFile({ ctx, node, options: { plugin: pluginName, exportName: name }, pluginOptions: nodeOptions }).file
    return { name, import: ast.factory.createImport({ name: [name], path }), toString: () => name }
  }
  const wrapValue = (value: unknown, self: object): unknown => {
    if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, member]) => [key, wrapValue(member, value)]))
    if (typeof value !== 'function') return value
    return (...args: Array<unknown>) => {
      const result = value.apply(self, args)
      return typeof result === 'string' ? toRefName(result, toNode(ctx, args[0])) : result
    }
  }

  const wrapped: Record<string, unknown> = {
    ...Object.fromEntries(Object.entries(resolver).flatMap(([key, value]) => (skipped.has(key) ? [] : [[key, wrapValue(value, resolver)]]))),
    name: (name: string) => toRefName(resolver.name(name), toNode(ctx, name)),
  }
  return {
    resolver: wrapped as FromResolver<SourceResolver<TSource>>,
    has: (node) => pluginOptionsFor({ ctx, node, plugin: pluginName }) !== null,
    import: (node, name) => toRefName(name, node),
  }
}
