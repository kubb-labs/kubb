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
 * - `TOutput`      — the type emitted by node handlers
 * - `TPrintOutput` — the type emitted by the public `print` override (defaults to `TOutput`)
 */
export type PrinterFactoryOptions<TName extends string = string, TOptions extends object = object, TOutput = unknown, TPrintOutput = TOutput> = {
  name: TName
  options: TOptions
  output: TOutput
  printOutput: TPrintOutput
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
   * to the node-level dispatcher
   */
  print: (node: SchemaNode) => T['printOutput'] | null | undefined
}

/**
 * Builder function passed to `definePrinter`. Receives the resolved options and returns the
 * printer configuration: a unique `name`, the stored `options`, node-level `nodes` handlers,
 * and an optional root-level `print` override.
 */
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
  print?: (this: PrinterHandlerContext<T['output'], T['options']>, node: SchemaNode) => T['printOutput'] | null | undefined
}

/**
 * Creates a named printer factory. Mirrors the `createPlugin` / `createAdapter` pattern
 * from `@kubb/core` — wraps a builder to make options optional and separates raw options
 * from resolved options.
 *
 * The builder receives resolved options and returns:
 * - `name` — a unique identifier for the printer
 * - `options` — options stored on the returned printer instance
 * - `nodes` — a map of `SchemaType` → handler functions that convert a `SchemaNode` to `TOutput`
 * - `print` _(optional)_ — a root-level override that becomes the public `printer.print`.
 *   Inside it, `this.print(node)` still dispatches to the `nodes` map — safe recursion, no infinite loop.
 *
 * When no `print` override is provided, `printer.print` is the node-level dispatcher directly.
 *
 * @example Basic usage — Zod schema printer
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
 * @example With a root-level `print` override to wrap output in a full declaration
 * ```ts
 * type TsPrinter = PrinterFactoryOptions<'ts', { typeName?: string }, ts.TypeNode, ts.Node>
 *
 * export const printerTs = definePrinter<TsPrinter>((options) => ({
 *   name: 'ts',
 *   options,
 *   nodes: { string: () => factory.keywordTypeNodes.string },
 *   print(node) {
 *     const type = this.print(node) // calls the node-level dispatcher
 *     if (!type || !this.options.typeName) return type
 *     return factory.createTypeAliasDeclaration(this.options.typeName, type)
 *   },
 * }))
 * ```
 */
export function definePrinter<T extends PrinterFactoryOptions = PrinterFactoryOptions>(build: PrinterBuilder<T>): (options?: T['options']) => Printer<T> {
  return createPrinterFactory<SchemaNode, SchemaType, SchemaNodeByType>((node) => node.type)(build) as (options?: T['options']) => Printer<T>
}

/**
 * Generic printer factory. Extracts the core dispatch + context logic so it can be reused
 * for any node type — not just `SchemaNode`. `definePrinter` is built on top of this.
 *
 * @param getKey — derives the handler-map key from a node. Return `undefined` to skip.
 *
 * @example
 * ```ts
 * export const defineFunctionPrinter = createPrinterFactory<FunctionNode, FunctionNodeType, FunctionNodeByType>(
 *   (node) => kindToHandlerKey[node.kind],
 * )
 * ```
 */
export function createPrinterFactory<TNode, TKey extends string, TNodeByKey extends Partial<Record<TKey, TNode>>>(getKey: (node: TNode) => TKey | undefined) {
  return function <T extends PrinterFactoryOptions>(
    build: (options: T['options']) => {
      name: T['name']
      options: T['options']
      nodes: Partial<{
        [K in TKey]: (
          this: { print: (node: TNode) => T['output'] | null | undefined; options: T['options'] },
          node: TNodeByKey[K],
        ) => T['output'] | null | undefined
      }>
      print?: (this: { print: (node: TNode) => T['output'] | null | undefined; options: T['options'] }, node: TNode) => T['printOutput'] | null | undefined
    },
  ): (options?: T['options']) => { name: T['name']; options: T['options']; print: (node: TNode) => T['printOutput'] | null | undefined } {
    return (options) => {
      const { name, options: resolvedOptions, nodes, print: printOverride } = build(options ?? ({} as T['options']))

      const context = {
        options: resolvedOptions,
        print: (node: TNode): T['output'] | null | undefined => {
          const key = getKey(node)
          if (key === undefined) return undefined

          const handler = nodes[key]

          if (!handler) return undefined

          return (handler as (this: typeof context, node: TNode) => T['output'] | null | undefined).call(context, node)
        },
      }

      return {
        name,
        options: resolvedOptions,
        print: (printOverride ? printOverride.bind(context) : context.print) as (node: TNode) => T['printOutput'] | null | undefined,
      }
    }
  }
}
