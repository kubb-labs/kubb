import type { SchemaNode, SchemaNodeByType, SchemaType } from './nodes/index.ts'

/**
 * Handler context for `definePrinter` — mirrors `PluginContext` from `@kubb/core`.
 * Available as `this` inside each node handler and the optional root-level `print`.
 * `this.print` always dispatches to the `nodes` handlers (node-level printer).
 */
export type PrinterHandlerContext<TOutput, TOptions extends object> = {
  /**
   * Recursively print a nested `SchemaNode` using the node-level handlers.
   */
  print: (node: SchemaNode) => TOutput | null | undefined
  /**
   * Options for this printer instance.
   */
  options: TOptions
}

/**
 * Handler for a specific `SchemaNode` variant identified by `SchemaType` key `T`.
 * Use a regular function (not an arrow function) so that `this` is available.
 */
export type PrinterHandler<TOutput, TOptions extends object, T extends SchemaType = SchemaType> = (
  this: PrinterHandlerContext<TOutput, TOptions>,
  node: SchemaNodeByType[T],
) => TOutput | null | undefined

/**
 * Shape of the type parameter passed to `definePrinter`.
 * Mirrors `AdapterFactoryOptions` / `PluginFactoryOptions` from `@kubb/core`.
 *
 * - `TName`        — unique string identifier (e.g. `'zod'`, `'ts'`)
 * - `TOptions`     — options passed to and stored on the printer
 * - `TOutput`      — the type emitted by node handlers and `printType`
 * - `TPrintOutput` — the type emitted by the public `print` override (defaults to `TOutput`)
 */
export type PrinterFactoryOptions<
  TName extends string = string,
  TOptions extends object = object,
  TOutput = unknown
> = {
  name: TName
  options: TOptions
  output: TOutput
}

/**
 * The object returned by calling a `definePrinter` instance.
 */
export type Printer<T extends PrinterFactoryOptions = PrinterFactoryOptions> = {
  /**
   * Unique identifier supplied at creation time.
   */
  name: T['name']
  /**
   * Options for this printer instance.
   */
  options: T['options']
  /**
   * Public printer. If the builder provides a root-level `print`, this calls that
   * higher-level function (which may produce full declarations). Otherwise falls back
   * to the node-level dispatcher, identical to `printType`.
   */
  print: (node: SchemaNode) => T['output'] | null | undefined
  /**
   * Always the node-level dispatcher — calls the matching `nodes` handler.
   * Use this when you need the raw type output without declaration wrapping.
   */
  printType: (node: SchemaNode) => T['output'] | null | undefined
  /**
   * Maps the node-level printer over an array of `SchemaNode`s.
   */
  for: (nodes: Array<SchemaNode>) => Array<T['output'] | null | undefined>
}

type PrinterBuilder<T extends PrinterFactoryOptions> = (options: T['options']) => {
  name: T['name']
  /**
   * Options to store on the printer.
   */
  options: T['options']
  nodes: Partial<{
    [K in SchemaType]: PrinterHandler<T['output'], T['options'], K>
  }>
  /**
   * Optional root-level print override. When provided, becomes the public `printer.print`.
   * `this.print(node)` inside this function calls the node-level dispatcher (`nodes` handlers),
   * not the override itself — so recursion is safe.
   */
  print?: (this: PrinterHandlerContext<T['output'], T['options']>, node: SchemaNode) => T['output'] | null | undefined
}

/**
 * Creates a named printer factory. Mirrors the `definePlugin` / `defineAdapter` pattern
 * from `@kubb/core` — wraps a builder to make options optional and separates raw options
 * from resolved options.
 *
 * The builder may return an optional root-level `print` alongside `nodes`. When present,
 * `printer.print` calls this higher-level function (e.g. to wrap output in a full declaration).
 * Inside it, `this.print(node)` always calls the node-level dispatcher — no infinite recursion.
 * `printer.printType(node)` is always the node-level dispatcher, useful for tests or
 * callers that need the raw type output.
 *
 * @example
 * ```ts
 * type ZodPrinter = PrinterFactoryOptions<'zod', { strict?: boolean }, string>
 *
 * export const zodPrinter = definePrinter<ZodPrinter>((options) => ({
 *   name: 'zod',
 *   options: { strict: options.strict ?? true },
 *   nodes: {
 *     string: () => 'z.string()',
 *     object(node) {
 *       const props = node.properties.map(p => `${p.name}: ${this.print(p.schema)}`).join(', ')
 *       return `z.object({ ${props} })`
 *     },
 *   },
 * }))
 * ```
 *
 * With a root-level `print` for declaration wrapping:
 *
 * @example
 * ```ts
 * type TsPrinter = PrinterFactoryOptions<'ts', { typeName?: string }, ts.TypeNode, ts.Node>
 *
 * export const tsPrinter = definePrinter<TsPrinter>((options) => ({
 *   name: 'ts',
 *   options,
 *   nodes: { string: () => factory.keywordTypeNodes.string },
 *   print(node) {
 *     const type = this.print(node) // node-level
 *     if (!type || !this.options.typeName) return type
 *     return factory.createTypeAliasDeclaration(this.options.typeName, type)
 *   },
 * }))
 * ```
 */
export function definePrinter<T extends PrinterFactoryOptions = PrinterFactoryOptions>(build: PrinterBuilder<T>): (options?: T['options']) => Printer<T> {
  return (options) => {
    const { name, options: resolvedOptions, nodes, print: printOverride } = build(options ?? ({} as T['options']))

    const context: PrinterHandlerContext<T['output'], T['options']> = {
      options: resolvedOptions,
      print: (node: SchemaNode) => {
        const type = node.type as SchemaType
        const handler = nodes[type]
        return handler ? (handler as PrinterHandler<T['output'], T['options']>).call(context, node as SchemaNodeByType[SchemaType]) : undefined
      },
    }

    return {
      name,
      options: resolvedOptions,
      printType: context.print,
      print: printOverride ? printOverride.bind(context) : (context.print),
      for: (nodes) => nodes.map(context.print),
    }
  }
}
