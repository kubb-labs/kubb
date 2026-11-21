import { ast, type ImportNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import type { PluginName, ResolvePluginOptions } from '@kubb/core'
import { type FileContext, type FileOptions, locateFile, pluginOptionsFor, useFileContext } from './file.ts'
import type { Resolver } from './resolver/Resolver.ts'
import type { ResolverOf } from './types.ts'

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

type RefMember<T> = T extends (...args: infer A) => infer R
  ? [Extract<R, string>] extends [never]
    ? T
    : (...args: A) => RefResult<R>
  : T extends object
    ? { [K in keyof T]: RefMember<T[K]> }
    : T

type RefMembers<T> = { [K in keyof T]: RefMember<T[K]> }

/**
 * A plugin's resolver whose name members return a `RefName` instead of a string.
 */
export type Ref<T extends Resolver = Resolver> = RefMembers<Omit<T, keyof Resolver>> & {
  name(name: string): RefName
  /**
   * `false` when the plugin's `include` or `exclude` rules leave `node` out, so it emits nothing to import.
   */
  has(node: SchemaNode | OperationNode): boolean
}

export type RefOptions = Pick<FileOptions, 'extname' | 'suffix'>

const skipped = new Set(['pluginName', 'default', 'isTypeOnly'])

function isNamespace(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function toNode(ctx: FileContext, arg: unknown): SchemaNode | OperationNode | null {
  const schemas = ctx.memo('kit:ref:schemas', () => new Map(ctx.schemas.flatMap((schema) => (schema.name ? [[schema.name, schema] as const] : []))))
  if (typeof arg === 'string') return schemas.get(arg) ?? null
  if (!isNamespace(arg)) return null
  if (arg.kind === 'Operation') return arg as unknown as OperationNode
  return (arg.kind === undefined || arg.kind === 'Schema') && typeof arg.name === 'string' ? (schemas.get(arg.name) ?? null) : null
}

/**
 * Another plugin's resolver, read from the current generator context, whose name members return the name plus the import from that plugin's file.
 * Without `plugin`, it wraps the current plugin's resolver. The first argument of a name member picks the file:
 * - an operation node: the plugin's file for that operation
 * - a schema node, `{ name }` or a schema name: the plugin's file for that schema, when the document has that schema
 *
 * A node the plugin's `include` or `exclude` rules leave out gets no import. Pass `extname` and `suffix` when the plugin writes its files with other values.
 *
 * @example
 * `ref('plugin-ts').name('Pet') // { name: 'Pet', import: { name: ['Pet'], path, isTypeOnly: true } }`
 */
export function ref<TName extends PluginName>(plugin?: TName, options: RefOptions = {}): Ref<ResolverOf<ResolvePluginOptions<TName>>> {
  const ctx = useFileContext('ref', 'Call `ref()` inside a generator method or a printer factory.')
  const pluginName = plugin ?? (ctx.plugin.name as PluginName)
  const resolver = ctx.getResolver(pluginName) as Resolver & Record<string, unknown>
  const toRefName = (name: string, arg: unknown): RefName => {
    const node = toNode(ctx, arg)
    if (!node || !pluginOptionsFor(ctx, node, pluginName).options) return { name, import: null, toString: () => name }
    const { path } = locateFile(ctx, node, { ...options, plugin: pluginName }).file
    return { name, import: ast.factory.createImport({ name: [name], path, isTypeOnly: resolver.isTypeOnly }), toString: () => name }
  }
  const wrap =
    (fn: (...args: Array<unknown>) => unknown, self: object) =>
    (...args: Array<unknown>) => {
      const result = fn.apply(self, args)
      return typeof result === 'string' ? toRefName(result, args[0]) : result
    }
  const members = Object.entries(resolver)
    .filter(([key]) => !skipped.has(key))
    .map(([key, value]) => {
      if (typeof value === 'function') return [key, wrap(value as (...args: Array<unknown>) => unknown, resolver)]
      if (!isNamespace(value)) return [key, value]
      const namespace = Object.entries(value).map(([method, member]) => [
        method,
        typeof member === 'function' ? wrap(member as (...args: Array<unknown>) => unknown, value) : member,
      ])
      return [key, Object.fromEntries(namespace)]
    })

  const wrapped: Record<string, unknown> = {
    ...Object.fromEntries(members),
    name: (name: string) => toRefName(resolver.name(name), name),
    has: (node: SchemaNode | OperationNode) => pluginOptionsFor(ctx, node, pluginName).options !== null,
  }
  return wrapped as Ref<ResolverOf<ResolvePluginOptions<TName>>>
}
