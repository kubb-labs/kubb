import type { PossiblePromise } from '@internals/utils'
import type { ImportNode, InputNode, SchemaNode } from '@kubb/ast'

/**
 * Source data handed to an adapter's `parse` function. Mirrors the config
 * input shape with paths resolved to absolute.
 *
 * - `{ type: 'path' }`: single file on disk.
 * - `{ type: 'data' }`: raw string or parsed object provided inline.
 */
export type AdapterSource = { type: 'path'; path: string } | { type: 'data'; data: string | unknown }

/**
 * Generic parameters used by `createAdapter` and the resulting `Adapter` type.
 *
 * - `TName`: unique adapter identifier (`'oas'`, `'asyncapi'`, ...).
 * - `TOptions`: user-facing options accepted by the adapter factory.
 * - `TResolvedOptions`: options after defaults are applied.
 * - `TDocument`: type of the parsed source document.
 */
export type AdapterFactoryOptions<
  TName extends string = string,
  TOptions extends object = object,
  TResolvedOptions extends object = TOptions,
  TDocument = unknown,
> = {
  name: TName
  options: TOptions
  resolvedOptions: TResolvedOptions
  document: TDocument
}

/**
 * Converts input files or inline data into Kubb's universal AST `InputNode`.
 *
 * Adapters live between the spec format and the plugins. The built-in
 * `@kubb/adapter-oas` handles OpenAPI 2.0, 3.0, and 3.1. A custom adapter can
 * support GraphQL, gRPC, or another schema language.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'kubb'
 * import { adapterOas } from '@kubb/adapter-oas'
 * import { pluginTs } from '@kubb/plugin-ts'
 *
 * export default defineConfig({
 *   input: { path: './petStore.yaml' },
 *   output: { path: './src/gen' },
 *   adapter: adapterOas(),
 *   plugins: [pluginTs()],
 * })
 * ```
 */
export type Adapter<TOptions extends AdapterFactoryOptions = AdapterFactoryOptions> = {
  /**
   * Human-readable adapter identifier (e.g. `'oas'`, `'asyncapi'`).
   */
  name: TOptions['name']
  /**
   * Resolved adapter options after defaults have been applied.
   */
  options: TOptions['resolvedOptions']
  /**
   * Parsed source document after the first `parse()` call. `null` before parsing.
   */
  document: TOptions['document'] | null
  /**
   * Parse the source into a universal `InputNode`.
   */
  parse: (source: AdapterSource) => PossiblePromise<InputNode>
  /**
   * Extract `ImportNode` entries for a schema tree.
   * Returns an empty array before the first `parse()` call.
   *
   * The `resolve` callback receives the collision-corrected schema name and must
   * return `{ name, path }` for the import, or `undefined` to skip it.
   */
  getImports: (node: SchemaNode, resolve: (schemaName: string) => { name: string; path: string }) => Array<ImportNode>
  /**
   * Validate the document at the given path or URL.
   */
  validate: (input: string, options?: { throwOnError?: boolean }) => Promise<void>
  /**
   * Memory-efficient streaming variant of `parse()`.
   *
   * Returns an `InputNode<true>` whose `schemas` and `operations` are `AsyncIterable`.
   * Each `for await` loop creates a fresh parse pass over the cached in-memory document.
   * No pre-built arrays are held in memory.
   */
  stream?: (source: AdapterSource) => Promise<InputNode<true>>
}

type AdapterBuilder<T extends AdapterFactoryOptions> = (options: T['options']) => Adapter<T>

/**
 * Defines a custom adapter that translates a spec format into Kubb's universal
 * AST, for example GraphQL, gRPC, or AsyncAPI. The built-in `@kubb/adapter-oas`
 * handles OpenAPI/Swagger documents.
 *
 * Adapters must return an `InputNode` from `parse`. That node is what every
 * plugin in the build consumes.
 *
 * @example
 * ```ts
 * import { createAdapter, type AdapterFactoryOptions } from '@kubb/core'
 * import { ast } from '@kubb/ast'
 *
 * type MyAdapter = AdapterFactoryOptions<'my-adapter', { validate?: boolean }>
 *
 * export const myAdapter = createAdapter<MyAdapter>((options) => ({
 *   name: 'my-adapter',
 *   options,
 *   document: null,
 *   async parse(_source) {
 *     // Convert the source (path or inline data) into an InputNode.
 *     return ast.factory.createInput()
 *   },
 *   getImports: () => [],
 *   async validate() {
 *     // Throw here when the spec is invalid.
 *   },
 * }))
 * ```
 */
export function createAdapter<T extends AdapterFactoryOptions = AdapterFactoryOptions>(build: AdapterBuilder<T>): (options?: T['options']) => Adapter<T> {
  return (options) => build(options ?? ({} as T['options']))
}
