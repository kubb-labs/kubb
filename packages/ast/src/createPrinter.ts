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
type PrinterHandlerContext<TOutput, TOptions extends object> = {
  /**
   * Recursively transform a nested `SchemaNode` to `TOutput` using the node-level handlers.
   * Use `this.transform` inside `nodes` handlers and inside the `print` override.
   */
  transform: (node: SchemaNode) => TOutput | null
  /**
   * Run the printer's built-in handler for the node, ignoring any override for its type.
   * Inside an override, `this.base(node)` returns what the printer would have emitted,
   * so the override can wrap it instead of re-implementing the handler. Nested nodes
   * still dispatch through the overrides.
   */
  base: (node: SchemaNode) => TOutput | null
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
type PrinterHandler<TOutput, TOptions extends object, T extends SchemaType = SchemaType> = (
  this: PrinterHandlerContext<TOutput, TOptions>,
  node: SchemaNodeByType[T],
) => TOutput | null

/**
 * Partial map of per-node-type handler overrides for a printer.
 *
 * Each key is a `SchemaType` string (e.g. `'date'`, `'string'`).
 * Supply only the handlers you want to replace. The printer's built-in
 * defaults fill in the rest.
 *
 * @example
 * ```ts
 * pluginZod({
 *   printer: {
 *     nodes: {
 *       date(): string {
 *         return 'z.string().date()'
 *       },
 *     } satisfies PrinterPartial<string, PrinterZodOptions>,
 *   },
 * })
 * ```
 */
export type PrinterPartial<TOutput, TOptions extends object> = Partial<{
  [K in SchemaType]: PrinterHandler<TOutput, TOptions, K>
}>

/**
 * Generic shape used by `definePrinter`.
 *
 * - `TName` unique string identifier (e.g. `'zod'`, `'ts'`)
 * - `TOptions` options passed to and stored on the printer instance
 * - `TOutput` the type emitted by node handlers
 * - `TPrintOutput` type returned by public `print` (defaults to `TOutput`)
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
   * Node-level dispatcher, converts a `SchemaNode` directly to `TOutput` using the `nodes` handlers.
   * Always dispatches through the `nodes` map. Never calls the `print` override.
   * Reach for it when you need the raw output (e.g. `ts.TypeNode`) without declaration wrapping.
   */
  transform: (node: SchemaNode) => T['output'] | null
  /**
   * Public printer. If the builder provides a root-level `print`, this calls that
   * higher-level function (which may produce full declarations).
   * Otherwise, falls back to the node-level dispatcher.
   */
  print: (node: SchemaNode) => T['printOutput'] | null
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
   * User-supplied handler overrides. An override wins over the matching `nodes` handler,
   * and can call `this.base(node)` to reuse the handler it replaced. Pass overrides here
   * instead of spreading them into `nodes`, otherwise `this.base` cannot find the original.
   */
  overrides?: Partial<{
    [K in SchemaType]: PrinterHandler<T['output'], T['options'], K>
  }>
  /**
   * Optional root-level print override. When provided, becomes the public `printer.print`.
   * Use `this.transform(node)` inside this function to dispatch to the node-level handlers (`nodes`),
   * not the override itself, so recursion is safe.
   */
  print?: (this: PrinterHandlerContext<T['output'], T['options']>, node: SchemaNode) => T['printOutput'] | null
}
/**
 * Creates a schema printer: a function that takes a `SchemaNode` and emits
 * code in your target language. Each plugin that produces code from schemas
 * (TypeScript types, Zod schemas, Faker factories) ships a printer built
 * with this helper.
 *
 * The builder receives resolved options and returns:
 *
 * - `name` unique identifier for the printer.
 * - `options` stored on the returned printer instance.
 * - `nodes` map of `SchemaType` → handler. Handlers return the rendered
 *   output (a string, a TypeScript AST node, ...) for that schema type.
 * - `overrides` (optional), user-supplied handlers that win over `nodes`.
 *   An override can call `this.base(node)` to reuse the handler it replaced.
 * - `print` (optional), top-level override exposed as `printer.print`.
 *   Use `this.transform(node)` inside it to dispatch to `nodes` recursively.
 *
 * Without a `print` override, `printer.print` falls back to `printer.transform`
 * (the node-level dispatcher).
 *
 * @example Tiny Zod printer
 * ```ts
 * import { createPrinter, type PrinterFactoryOptions } from '@kubb/ast'
 *
 * type PrinterZod = PrinterFactoryOptions<'zod', { strict?: boolean }, string>
 *
 * export const zodPrinter = createPrinter<PrinterZod>((options) => ({
 *   name: 'zod',
 *   options: { strict: options.strict ?? true },
 *   nodes: {
 *     string: () => 'z.string()',
 *     object(node) {
 *       const props = node.properties
 *         .map((p) => `${p.name}: ${this.transform(p.schema)}`)
 *         .join(', ')
 *       return `z.object({ ${props} })`
 *     },
 *   },
 * }))
 * ```
 */
export function createPrinter<T extends PrinterFactoryOptions = PrinterFactoryOptions>(build: PrinterBuilder<T>): (options?: T['options']) => Printer<T> {
  return (options) => {
    const { name, options: resolvedOptions, nodes, overrides, print: printOverride } = build((options ?? {}) as T['options'])
    const merged = overrides ? { ...nodes, ...overrides } : nodes

    const context = {
      options: resolvedOptions,
      transform: (node: SchemaNode): T['output'] | null => {
        const handler = merged[node.type]
        if (!handler) return null

        return (handler as (this: typeof context, node: SchemaNode) => T['output'] | null).call(context, node)
      },
      base: (node: SchemaNode): T['output'] | null => {
        const handler = nodes[node.type]
        if (!handler) return null

        return (handler as (this: typeof context, node: SchemaNode) => T['output'] | null).call(context, node)
      },
    }

    return {
      name,
      options: resolvedOptions,
      transform: context.transform,
      print: (printOverride ? printOverride.bind(context) : context.transform) as (node: SchemaNode) => T['printOutput'] | null,
    }
  }
}
