import { ast, type ImportNode, type OperationNode, type SchemaNode } from '@kubb/ast'
import type { PluginName, ResolvePluginOptions } from '@kubb/core'
import { type FileContext, locateFile, pluginOptionsFor, useFileContext } from './file.ts'
import type { Resolver } from './resolver/Resolver.ts'
import type { ResolverOf } from './types.ts'

/**
 * A name from a plugin's resolver, with the import that brings it into scope. It prints as the name, so it works in a template string too.
 */
export type RefName = {
  readonly name: string
  /**
   * `null` when the first argument names no file, such as a call without a node or a schema name.
   */
  readonly import: ImportNode | null
  toString(): string
}

type RefMember<T> = T extends (...args: infer A) => string
  ? (...args: A) => RefName
  : T extends (...args: never) => unknown
    ? T
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

const skipped = new Set(['pluginName', 'default', 'isTypeOnly'])

function toNode(arg: unknown): SchemaNode | OperationNode | null {
  if (typeof arg === 'string') return ast.factory.createSchema({ type: 'unknown', name: arg })
  if (typeof arg !== 'object' || arg === null) return null
  const node = arg as { kind?: string; name?: unknown }
  if (node.kind === 'Operation' || (node.kind === 'Schema' && node.name)) return node as SchemaNode | OperationNode
  return typeof node.name === 'string' ? ast.factory.createSchema({ type: 'unknown', name: node.name }) : null
}

export function createRef<T extends Resolver = Resolver>(ctx: FileContext, plugin: PluginName = ctx.plugin.name as PluginName): Ref<T> {
  const resolver = ctx.getResolver(plugin) as Resolver & Record<string, unknown>
  const toRefName = (name: string, arg: unknown): RefName => {
    const node = toNode(arg)
    const path = node ? locateFile(ctx, node, { plugin }).file.path : null
    return { name, import: path ? ast.factory.createImport({ name: [name], path, isTypeOnly: resolver.isTypeOnly }) : null, toString: () => name }
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
      if (typeof value !== 'object' || value === null) return [key, value]
      const namespace = Object.entries(value).map(([method, member]) => [method, typeof member === 'function' ? wrap(member, value) : member])
      return [key, Object.fromEntries(namespace)]
    })

  const wrapped: Record<string, unknown> = {
    ...Object.fromEntries(members),
    name: (name: string) => toRefName(resolver.name(name), name),
    has: (node: SchemaNode | OperationNode) => pluginOptionsFor(ctx, node, plugin).options !== null,
  }
  return wrapped as Ref<T>
}

/**
 * Another plugin's resolver, read from the current generator context, whose name members return the name plus the import from that plugin's file.
 * Without `plugin`, it wraps the current plugin's resolver. The first argument of a name member picks the file:
 * - an operation node: the plugin's file for that operation
 * - a schema node, `{ name }` or a schema name: the plugin's file for that schema
 *
 * @example
 * `ref('plugin-ts').name('Pet') // { name: 'Pet', import: { name: ['Pet'], path, isTypeOnly: true } }`
 */
export function ref<TName extends PluginName>(plugin?: TName): Ref<ResolverOf<ResolvePluginOptions<TName>>> {
  return createRef<ResolverOf<ResolvePluginOptions<TName>>>(useFileContext('ref', 'Call `ref()` inside a generator method or a printer factory.'), plugin)
}
