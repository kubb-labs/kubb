import type { PossiblePromise } from '@internals/utils'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import type { PluginName, PluginType, PluginVisitContext, RendererFactory, ResolvePluginOptions } from '@kubb/core'
import type { Resolver } from './resolver/Resolver.ts'

// A plugin type that names no resolver gets the default resolver.
type ResolverOf<T> = unknown extends T ? Resolver : T

/** The plugin type generators default to: any plugin with kit's default `Resolver`. */
export type DefaultPluginType = PluginType<string, object, object, Resolver>

/** Context passed to a generator's `schema`, `operation` and `operations` methods: core's visit context plus the plugin's resolver and its resolved options. */
export type GeneratorContext<TOptions extends PluginType = DefaultPluginType> = PluginVisitContext<TOptions> & {
  /** Get a resolver by plugin name, typed via `Kubb.PluginRegistry` when registered. */
  getResolver<TName extends PluginName>(name: TName): ResolverOf<ResolvePluginOptions<TName>['resolver']>
  /** The current plugin's resolver: a `setResolver` registration, or the default resolver. */
  resolver: TOptions['resolver']
  /** Resolved options after exclude/include/override filtering. */
  options: TOptions['resolvedOptions']
  /** The printer from the plugin's `setPrinter` factory, or `undefined` without one. */
  printer: Exclude<TOptions['printer'], undefined>
}

/**
 * Declares a named generator unit that walks the AST and emits files.
 *
 * `schema` runs for each schema node and `operation` for each operation node. `operations` runs
 * once after every operation node is walked. JSX-based generators require a `renderer` factory.
 * Return `Array<FileNode>` directly, or call `ctx.upsertFile()` manually and return `null` to
 * bypass rendering.
 *
 * @note Generators are consumed by plugins and registered with the `addGenerator()` composable in `setup` or `kubb:plugin:setup`.
 *
 * @example
 * ```ts
 * import { defineGenerator } from '@kubb/kit'
 * import { jsxRenderer } from '@kubb/renderer-jsx'
 *
 * export const typeGenerator = defineGenerator({
 *   name: 'typescript',
 *   renderer: jsxRenderer,
 *   schema(node, ctx) {
 *     const { adapter, resolver, root, options } = ctx
 *     return <File ...><Type node={node} resolver={resolver} /></File>
 *   },
 * })
 * ```
 */
export type Generator<TOptions extends PluginType = DefaultPluginType, TElement = unknown> = {
  /** Used in diagnostic messages and debug output. */
  name: string
  /** Renderer factory for generators that return elements, such as `jsxRenderer` from `@kubb/renderer-jsx`. Leave it unset or `null` for generators that return files. */
  renderer?: RendererFactory<TElement> | null
  /** Checked before `schema` or `operation` runs for a node. Returning `false` skips that node. It does not gate `operations`. */
  match?: (node: SchemaNode | OperationNode, ctx: GeneratorContext<TOptions>) => PossiblePromise<boolean>
  /** Called for each schema node in the AST walk, with the per-node options in `ctx.options`. */
  schema?: (node: SchemaNode, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | Array<FileNode> | undefined | null>
  /** Called for each operation node in the AST walk, with the per-node options in `ctx.options`. */
  operation?: (node: OperationNode, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | Array<FileNode> | undefined | null>
  /** Called once after all operations have been walked, with the plugin-level options in `ctx.options`. */
  operations?: (nodes: Array<OperationNode>, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | Array<FileNode> | undefined | null>
}

declare global {
  namespace Kubb {
    interface KubbHooksRegistry {
      'kubb:generate:schema': [node: SchemaNode, ctx: GeneratorContext]
      'kubb:generate:operation': [node: OperationNode, ctx: GeneratorContext]
      'kubb:generate:operations': [nodes: Array<OperationNode>, ctx: GeneratorContext]
    }
  }
}
