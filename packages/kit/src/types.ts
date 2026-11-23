import type { PossiblePromise } from '@internals/utils'
import type { FileNode, OperationNode, SchemaNode } from '@kubb/ast'
import type { PluginType as CorePluginType, PluginName, PluginVisitContext, RendererFactory, ResolvePluginOptions } from '@kubb/core'
import type { FileOptions, FileTarget } from './file.ts'
import type { From, SourceResolver } from './from.ts'
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
export type ResolverOf<T> = T extends { resolver: infer TResolver } ? (unknown extends TResolver ? Resolver : TResolver) : Resolver

/**

 * The resolver a plugin name or a provided name reads.

 */
export type ResolverFor<TName> = TName extends ProvideName ? Extract<Kubb.ProvideRegistry[TName], Resolver> : ResolverOf<ResolvePluginOptions<TName>>

/** Context a printer factory receives: core's visit context plus the plugin's resolver and its resolved options. */
export type PrinterContext<TOptions extends PluginType = PluginType> = PluginVisitContext<TOptions> & {
  /**
   * Get a resolver by plugin name or provided name, typed via `Kubb.PluginRegistry` and `Kubb.ProvideRegistry`.
   */
  getResolver<TName extends PluginName | ProvideName>(name: TName): ResolverFor<TName>
  /** The current plugin's resolver: a `setResolver` registration, or the default resolver. */
  resolver: TOptions['resolver']
  /** Resolved options after exclude/include/override filtering. */
  options: TOptions['resolvedOptions']
}

/** Builds the plugin's printer from a `PrinterContext`, which is also its `this` and `useKubb()`. Register it with `setPrinter`. */
export type PrinterFactory<TOptions extends PluginType = PluginType> = (ctx: PrinterContext<TOptions>) => Exclude<TOptions['printer'], undefined>

/** Context passed to a generator's `schema`, `operation` and `operations` methods: the printer context plus the built printer. */
export type GeneratorContext<TOptions extends PluginType = PluginType> = PrinterContext<TOptions> & {
  /** The printer from the plugin's `setPrinter` factory, or `undefined` without one. */
  printer: Exclude<TOptions['printer'], undefined>
  /**
   * The `<File>` props for the file `node` is written to. See the `file` composable.
   */
  file(node: SchemaNode | OperationNode, options?: FileOptions): FileTarget
  /**
   * Another plugin's resolver, with each name's import. See the `from` composable.
   */
  from<TSource extends PluginName | ProvideName = never>(source?: TSource): From<SourceResolver<TSource, Extract<TOptions['resolver'], Resolver>>>
}

/**
 * Declares a named generator unit that walks the AST and emits files.
 *
 * `schema` runs for each schema node and `operation` for each operation node. `operations` runs
 * once after every operation node is walked. JSX elements render with `jsxRenderer` unless `renderer` says otherwise.
 * Return a `FileNode` or `Array<FileNode>` directly, or call `ctx.upsertFile()` manually and return `null` to
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
 *
 * export const typeGenerator = defineGenerator({
 *   name: 'typescript',
 *   schema(node, ctx) {
 *     const { adapter, resolver, root, options } = ctx
 *     return <File ...><Type node={node} resolver={resolver} /></File>
 *   },
 * })
 * ```
 */
export type Generator<TOptions extends PluginType = PluginType, TElement = unknown> = {
  /** Used in diagnostic messages and debug output. */
  name: string
  /** Renderer factory for the elements the generator returns. Leave it unset to render JSX with `jsxRenderer`, or set `null` for a generator that only returns files. */
  renderer?: RendererFactory<TElement> | null
  /** Checked before `schema` or `operation` runs for a node. Returning `false` skips that node. It does not gate `operations`. */
  match?: (node: SchemaNode | OperationNode, ctx: GeneratorContext<TOptions>) => PossiblePromise<boolean>
  /** Called for each schema node in the AST walk, with the per-node options in `ctx.options`. */
  schema?: (node: SchemaNode, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | FileNode | Array<FileNode> | undefined | null>
  /** Called for each operation node in the AST walk, with the per-node options in `ctx.options`. */
  operation?: (node: OperationNode, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | FileNode | Array<FileNode> | undefined | null>
  /** Called once after all operations have been walked, with the plugin-level options in `ctx.options`. */
  operations?: (nodes: Array<OperationNode>, ctx: GeneratorContext<TOptions>) => PossiblePromise<TElement | FileNode | Array<FileNode> | undefined | null>
  // ThisType instead of a `this` parameter, so a direct `generator.schema(node, ctx)` call still compiles.
} & ThisType<GeneratorContext<TOptions>>

/**

 * A name in `Kubb.ProvideRegistry`, such as `'types'`.

 */
export type ProvideName = keyof Kubb.ProvideRegistry

declare global {
  namespace Kubb {
    /**
     * Resolvers a plugin can `provide()` under a name, such as `types: ResolverTs`, for `from(name)` to read.
     */
    interface ProvideRegistry {}
    /**
     * Events kit fires on the shared hooks bus while a plugin defined with its `defineExtension` walks the input.
     * They fire only when the config has an adapter, since without one no walk occurs. Each fires only for a plugin with generators of its kind.
     */
    interface KubbHooksRegistry {
      /** Fires for each schema node the plugin keeps, after its `schema` generators ran. */
      'kubb:generate:schema': [node: SchemaNode, ctx: GeneratorContext]
      /** Fires for each operation node the plugin keeps, after its `operation` generators ran. */
      'kubb:generate:operation': [node: OperationNode, ctx: GeneratorContext]
      /** Fires once after the walk, after the `operations` generators ran with every kept operation. */
      'kubb:generate:operations': [nodes: Array<OperationNode>, ctx: GeneratorContext]
    }
  }
}
