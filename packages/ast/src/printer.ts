import type { SchemaNode, SchemaNodeByType, SchemaType } from './nodes/index.ts'

/**
 * Handler context for `definePrinter` — mirrors `PluginContext` from `@kubb/core`.
 * Available as `this` inside each node handler.
 */
export type PrinterHandlerContext<TOutput, TOptions extends object> = {
  /**
   * Recursively print a nested `SchemaNode`.
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
 * - `TName` — unique string identifier (e.g. `'zod'`, `'ts'`)
 * - `TOptions` — options passed to and stored on the printer
 * - `TOutput` — the type emitted by `print` (typically `string`)
 */
export type PrinterFactoryOptions<TName extends string = string, TOptions extends object = object, TOutput = unknown> = {
  name: TName
  options: TOptions
  output: TOutput
}

/**
 * The object returned by calling a `definePrinter` instance.
 * Mirrors the shape of `Adapter` from `@kubb/core`.
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
   * Emits `TOutput` from a `SchemaNode`. Returns `null | undefined` when no handler matches.
   */
  print: (node: SchemaNode) => T['output'] | null | undefined
  /**
   * Maps `print` over an array of `SchemaNode`s.
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
}

/**
 * Creates a named printer factory. Mirrors the `definePlugin` / `defineAdapter` pattern
 * from `@kubb/core` — wraps a builder to make options optional and separates raw options
 * from resolved options.
 *
 * @example
 * ```ts
 * type ZodPrinter = PrinterFactoryOptions<'zod', { strict?: boolean }, { strict: boolean }, string>
 *
 * export const zodPrinter = definePrinter<ZodPrinter>((options) => {
 *   const { strict = true } = options
 *   return {
 *     name: 'zod',
 *     options: { strict },
 *     nodes: {
 *       string(node) {
 *         return `z.string()`
 *       },
 *       object(node) {
 *         const props = node.properties
 *           ?.map(p => `${p.name}: ${this.print(p)}`)
 *           .join(', ') ?? ''
 *         return `z.object({ ${props} })`
 *       },
 *     },
 *   }
 * })
 *
 * const printer = zodPrinter({ strict: false })
 * printer.name            // 'zod'
 * printer.options         // { strict: false }
 * printer.print(node)     // 'z.string()'
 * ```
 */
export function definePrinter<T extends PrinterFactoryOptions = PrinterFactoryOptions>(build: PrinterBuilder<T>): (options?: T['options']) => Printer<T> {
  return (options) => {
    const { name, options: resolvedOptions, nodes } = build(options ?? ({} as T['options']))

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
      print: context.print,
      for: (nodes) => nodes.map(context.print),
    }
  }
}
