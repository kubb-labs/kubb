import type { PossiblePromise } from '@internals/utils'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import type { PluginType as CorePluginType, PluginName, PluginVisitContext, RendererFactory, ResolvePluginOptions } from '@kubb/core'
import type { Resolver } from './resolver/Resolver.ts'

/**
 * Core's plugin type plus the resolver and printer that kit's generators receive.
 *
 * @example
 * `export type PluginTs = PluginType<'plugin-ts', Options, ResolvedOptions, ResolverTs, PrinterTs>`
 */
export type PluginType<
  /** Unique plugin name. */
  TName extends string = string,
  /** User-facing plugin options. */
  TOptions extends object = object,
  /** Plugin options after defaults are applied. */
  TResolvedOptions extends object = TOptions,
  /** Resolver that generators receive as `ctx.resolver`, registered with `setResolver`. Define it with `createResolver`. */
  TResolver = Resolver,
  /** Printer that generators receive as `ctx.printer`, registered with `setPrinter`. */
  TPrinter = unknown,
> = CorePluginType<TName, TOptions, TResolvedOptions> & {
  resolver: TResolver
  printer?: TPrinter
}

// A plugin type that names no resolver, such as one typed with core's `PluginType`, gets the default resolver.
type ResolverOf<T> = T extends { resolver: infer TResolver } ? (unknown extends TResolver ? Resolver : TResolver) : Resolver

/** The plugin type generators default to: any plugin with kit's default `Resolver`. */
export type DefaultPluginType = PluginType<string, object, object, Resolver>

/** Context a printer factory receives: core's visit context plus the plugin's resolver and its resolved options. */
export type PrinterContext<TOptions extends PluginType = DefaultPluginType> = PluginVisitContext<TOptions> & {
  /** Get a resolver by plugin name, typed via `Kubb.PluginRegistry` when registered. */
  getResolver<TName extends PluginName>(name: TName): ResolverOf<ResolvePluginOptions<TName>>
  /** The current plugin's resolver: a `setResolver` registration, or the default resolver. */
  resolver: TOptions['resolver']
  /** Resolved options after exclude/include/override filtering. */
  options: TOptions['resolvedOptions']
}

/** Builds the plugin's printer from a `PrinterContext`, which is also its `this` and `useKubb()`. Register it with `setPrinter`. */
export type PrinterFactory<TOptions extends PluginType = DefaultPluginType> = (ctx: PrinterContext<TOptions>) => Exclude<TOptions['printer'], undefined>

/** Context passed to a generator's `schema`, `operation` and `operations` methods: the printer context plus the built printer. */
export type GeneratorContext<TOptions extends PluginType = DefaultPluginType> = PrinterContext<TOptions> & {
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
 * `match`, `schema`, `operation` and `operations` run with the generator context as `this`, as `ctx`
 * and as `useKubb()`, so composables such as `useConfig()` work in them.
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
  // `this` is the generator context. ThisType types it without a `this` parameter, so a direct `generator.schema(node, ctx)` call still compiles.
} & ThisType<GeneratorContext<TOptions>>

declare global {
  namespace Kubb {
    /**
     * Events kit fires on the shared hooks bus while a plugin defined with its `defineExtension` walks the input.
     * They fire only when the config has an adapter, since without one no walk occurs.
     */
    interface KubbHooksRegistry {
      /** Fires for each schema node the plugin keeps, after its `schema` generators ran. */
      'kubb:generate:schema': [node: SchemaNode, ctx: GeneratorContext]
      /** Fires for each operation node the plugin keeps, after its `operation` generators ran. Skipped for a plugin without any. */
      'kubb:generate:operation': [node: OperationNode, ctx: GeneratorContext]
      /** Fires once after the walk, after the `operations` generators ran with every kept operation. Skipped for a plugin without any. */
      'kubb:generate:operations': [nodes: Array<OperationNode>, ctx: GeneratorContext]
    }
  }
}
