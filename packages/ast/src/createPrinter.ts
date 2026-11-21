import type { ImportNode } from './nodes/file.ts'
import type { SchemaNode, SchemaNodeByType, SchemaType } from './nodes/schema.ts'

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
 *   base: () => 'value',
 * }
 * ```
 */
type PrinterHandlerContext<TOutput, TOptions extends object> = {
  /**
   * Recursively transform a nested `SchemaNode` to `TOutput` using the node-level handlers.
   * Use `this.transform` inside `nodes` handlers and inside the `print` override.
   * The optional `options` are merged over `this.options` for that child call only.
   */
  transform: (node: SchemaNode, options?: Partial<TOptions>) => TOutput | null
  /**
   * Run the printer's built-in handler for the node, ignoring any override for its type.
   * Inside an override, `this.base(node)` returns what the printer would have emitted,
   * so the override can wrap it instead of re-implementing the handler. Nested nodes
   * still dispatch through the overrides. The optional `options` merge like `this.transform`.
   */
  base: (node: SchemaNode, options?: Partial<TOptions>) => TOutput | null
  /** Declares an import the printed code needs. The generator reads it back with `printer.drainImports()`. */
  import: (node: ImportNode) => void
  /**
   * Options for this printer instance.
   */
  options: TOptions
  /** The schema node whose handler called `this.transform`, `undefined` at the root. */
  parent?: SchemaNode
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
  transform: (node: SchemaNode, options?: Partial<T['options']>) => T['output'] | null
  /**
   * Public printer. If the builder provides a root-level `print`, this calls that
   * higher-level function (which may produce full declarations).
   * Otherwise, falls back to the node-level dispatcher.
   */
  print: (node: SchemaNode, options?: Partial<T['options']>) => T['printOutput'] | null
  /**
   * Returns this printer with `extra` merged over its options. It shares the handlers and the import
   * list, so building the printer once and calling `with` per node skips the builder.
   *
   * @example
   * `printer.with({ keysToOmit: ['id'] }).print(node)`
   */
  with: (extra: Partial<T['options']>) => Printer<T>
  /** Returns the imports declared with `this.import(...)` since the last call, then clears them. */
  drainImports: () => Array<ImportNode>
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
  nodes: PrinterPartial<T['output'], T['options']>
  /**
   * User-supplied handler overrides. An override wins over the matching `nodes` handler,
   * and can call `this.base(node)` to reuse the handler it replaced. Pass overrides here
   * instead of spreading them into `nodes`, otherwise `this.base` cannot find the original.
   */
  overrides?: PrinterPartial<T['output'], T['options']>
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
 * import { ast, createPrinter } from '@kubb/kit'
 *
 * type PrinterZod = ast.PrinterFactoryOptions<'zod', { strict?: boolean }, string>
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

    const collectedImports: Array<ImportNode> = []
    const importNode = (node: ImportNode): void => {
      collectedImports.push(node)
    }
    type Context = PrinterHandlerContext<T['output'], T['options']>
    const withOptions = (current: T['options'], extra?: Partial<T['options']>): T['options'] => (extra ? { ...current, ...extra } : current)

    const dispatch = (table: PrinterPartial<T['output'], T['options']>, node: SchemaNode, options: T['options'], parent?: SchemaNode): T['output'] | null => {
      const handler = table[node.type]
      if (!handler) return null

      return (handler as (this: Context, node: SchemaNode) => T['output'] | null).call(createContext(options, node, parent), node)
    }

    // `current` is the node whose handler gets this context, so it becomes the parent of what that handler transforms.
    function createContext(options: T['options'], current?: SchemaNode, parent?: SchemaNode): Context {
      const context: Context = {
        options,
        parent,
        import: importNode,
        transform: (node, extra) => dispatch(merged, node, withOptions(context.options, extra), current),
        base: (node, extra) => dispatch(nodes, node, withOptions(context.options, extra), parent),
      }
      return context
    }

    const drainImports = () => collectedImports.splice(0)

    const toPrinter = (options: T['options']): Printer<T> => {
      const root = createContext(options)
      return {
        name,
        options,
        transform: root.transform,
        print: (printOverride
          ? (node: SchemaNode, extra?: Partial<T['options']>) => printOverride.call(extra ? createContext(withOptions(options, extra)) : root, node)
          : root.transform) as Printer<T>['print'],
        with: (extra) => toPrinter(withOptions(options, extra)),
        drainImports,
      }
    }

    return toPrinter(resolvedOptions)
  }
}
