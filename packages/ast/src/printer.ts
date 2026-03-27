import type { SchemaNode, SchemaNodeByType, SchemaType } from './nodes/index.ts'

/**
 * Runtime context passed as `this` to printer handlers.
 *
 * `this.transform` dispatches to node-level handlers from `nodes`.
 *
 * @example
 * ```ts
 * const context: PrinterHandlerContext<string, {}> = {
 *   options: {},
 *   transform: () => 'value',
 * }
 * ```
 */
export type PrinterHandlerContext<TOutput, TOptions extends object> = {
  /**
   * Recursively transform a nested `SchemaNode` to `TOutput` using the node-level handlers.
   * Use `this.transform` inside `nodes` handlers and inside the `print` override.
   */
  transform: (node: SchemaNode) => TOutput | null | undefined
  /**
   * Options for this printer instance.
   */
  options: TOptions
}

/**
 * Handler for one schema node type.
 *
 * Use a regular function (not an arrow function) if you need `this`.
 *
 * @example
 * ```ts
 * const handler: PrinterHandler<string, {}, 'string'> = function () {
 *   return 'string'
 * }
 * ```
 */
export type PrinterHandler<TOutput, TOptions extends object, T extends SchemaType = SchemaType> = (
  this: PrinterHandlerContext<TOutput, TOptions>,
  node: SchemaNodeByType[T],
) => TOutput | null | undefined

/**
 * Generic shape used by `definePrinter`.
 *
 * - `TName`        — unique string identifier (e.g. `'zod'`, `'ts'`)
 * - `TOptions`     — options passed to and stored on the printer instance
 * - `TOutput`      — the type emitted by node handlers
 * - `TPrintOutput` — type returned by public `print` (defaults to `TOutput`)
 *
 * @example
 * ```ts
 * type MyPrinter = PrinterFactoryOptions<'my', { strict: boolean }, string>
 * ```
 */
export type PrinterFactoryOptions<TName extends string = string, TOptions extends object = object, TOutput = unknown, TPrintOutput = TOutput> = {
  name: TName
  options: TOptions
  output: TOutput
  printOutput: TPrintOutput
}

/**
 * Printer instance returned by a printer factory.
 *
 * @example
 * ```ts
 * const printer = definePrinter((options: {}) => ({ name: 'x', options, nodes: {} }))({})
 * ```
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
   * Node-level dispatcher — converts a `SchemaNode` directly to `TOutput` using the `nodes` handlers.
   * Always dispatches through the `nodes` map; never calls the `print` override.
   * Use this when you need the raw output (e.g. `ts.TypeNode`) without declaration wrapping.
   */
  transform: (node: SchemaNode) => T['output'] | null | undefined
  /**
   * Public printer. If the builder provides a root-level `print`, this calls that
   * higher-level function (which may produce full declarations).
   * Otherwise, falls back to the node-level dispatcher.
   */
  print: (node: SchemaNode) => T['printOutput'] | null | undefined
}

/**
 * Builder function passed to `definePrinter`.
 *
 * It receives resolved options and returns:
 * - `name`
 * - `options`
 * - `nodes` handlers
 * - optional top-level `print` override
 *
 * @example
 * ```ts
 * const build = (options: {}) => ({ name: 'x' as const, options, nodes: {} })
 * ```
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
   * Use `this.transform(node)` inside this function to dispatch to the node-level handlers (`nodes`),
   * not the override itself — so recursion is safe.
   */
  print?: (this: PrinterHandlerContext<T['output'], T['options']>, node: SchemaNode) => T['printOutput'] | null
}

/**
 * Creates a schema printer factory.
 *
 * This function wraps a builder and makes options optional at call sites.
 *
 * The builder receives resolved options and returns:
 * - `name` — a unique identifier for the printer
 * - `options` — options stored on the returned printer instance
 * - `nodes` — a map of `SchemaType` → handler functions that convert a `SchemaNode` to `TOutput`
 * - `print` _(optional)_ — top-level override exposed as `printer.print`
 *   - Inside this function, use `this.transform(node)` to dispatch to the `nodes` map
 *   - This keeps recursion safe and avoids self-calls
 *
 * When no `print` override is provided, `printer.print` falls back to `printer.transform` (the node-level dispatcher).
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
 *       const props = node.properties.map(p => `${p.name}: ${this.transform(p.schema)}`).join(', ')
 *       return `z.object({ ${props} })`
 *     },
 *   },
 * }))
 * ```
 */
export function definePrinter<T extends PrinterFactoryOptions = PrinterFactoryOptions>(build: PrinterBuilder<T>): (options?: T['options']) => Printer<T> {
  return createPrinterFactory<SchemaNode, SchemaType, SchemaNodeByType>((node) => node.type)(build) as (options?: T['options']) => Printer<T>
}

/**
 * Generic printer-factory function used by `definePrinter` and `defineFunctionPrinter`.
 **
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
          this: { transform: (node: TNode) => T['output'] | null | undefined; options: T['options'] },
          node: TNodeByKey[K],
        ) => T['output'] | null | undefined
      }>
      print?: (this: { transform: (node: TNode) => T['output'] | null | undefined; options: T['options'] }, node: TNode) => T['printOutput'] | null | undefined
    },
  ): (options?: T['options']) => {
    name: T['name']
    options: T['options']
    transform: (node: TNode) => T['output'] | null | undefined
    print: (node: TNode) => T['printOutput'] | null | undefined
  } {
    return (options) => {
      const { name, options: resolvedOptions, nodes, print: printOverride } = build(options ?? ({} as T['options']))

      const context = {
        options: resolvedOptions,
        transform: (node: TNode): T['output'] | null | undefined => {
          const key = getKey(node)
          if (key === undefined) return null

          const handler = nodes[key]

          if (!handler) return null

          return (handler as (this: typeof context, node: TNode) => T['output'] | null | undefined).call(context, node)
        },
      }

      return {
        name,
        options: resolvedOptions,
        transform: context.transform,
        print: (printOverride ? printOverride.bind(context) : context.transform) as (node: TNode) => T['printOutput'] | null | undefined,
      }
    }
  }
}
