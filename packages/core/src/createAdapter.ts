import type { PossiblePromise } from '@internals/utils'
import type { ImportNode, InputNode, InputStreamNode, SchemaNode } from '@kubb/ast'
import type { Storage } from './createStorage.ts'

/**
 * Optional disk-cache configuration threaded through from `createKubb` into adapter methods.
 *
 * Adapters read from / write to this cache to avoid re-parsing the same source document on
 * every build. The storage backend is the one the user configured (`config.storage`), and
 * keys are absolute paths under `<root>/.kubb/.cache/`.
 */
export type AdapterCache = {
  /** Storage backend to use for reading and writing cache entries. */
  storage: Storage
  /** Absolute path to the cache directory, e.g. `/project/.kubb/.cache`. */
  dir: string
}

/**
 * Source data passed to an adapter's `parse` function.
 * Mirrors the config input shape with paths resolved to absolute.
 */
export type AdapterSource =
  | { type: 'path'; path: string; cache?: AdapterCache }
  | { type: 'data'; data: string | unknown; cache?: AdapterCache }
  | { type: 'paths'; paths: Array<string>; cache?: AdapterCache }

/**
 * Generic type parameters for an adapter definition.
 *
 * - `TName` — unique identifier (e.g. `'oas'`, `'asyncapi'`)
 * - `TOptions` — user-facing options passed to the adapter factory
 * - `TResolvedOptions` — options after defaults applied
 * - `TDocument` — type of the parsed source document
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
 * Adapter that converts input files or data into an `InputNode`.
 *
 * Adapters parse different schema formats (OpenAPI, AsyncAPI, Drizzle, etc.) into Kubb's
 * universal intermediate representation that all plugins consume.
 *
 * @example
 * ```ts
 * import { adapterOas } from '@kubb/adapter-oas'
 *
 * export default defineConfig({
 *   adapter: adapterOas(),
 *   input: { path: './openapi.yaml' },
 *   plugins: [pluginTs(), pluginZod()],
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
   * Lightweight pre-flight count of schemas and operations without parsing AST nodes.
   * The adapter should cache the loaded document so subsequent `parse()` or `stream()` calls
   * do not reload it.
   *
   * Used by the core to decide whether to use `parse()` or `stream()`.
   */
  count?: (source: AdapterSource) => Promise<{ schemas: number; operations: number }>
  /**
   * Memory-efficient streaming variant of `parse()`.
   *
   * Returns an `InputStreamNode` whose `schemas` and `operations` are `AsyncIterable`.
   * Each `for await` loop creates a fresh parse pass over the cached in-memory document —
   * no pre-built arrays are held in memory.
   */
  stream?: (source: AdapterSource) => Promise<InputStreamNode>
}

type AdapterBuilder<T extends AdapterFactoryOptions> = (options: T['options']) => Adapter<T>

/**
 * Factory for implementing custom adapters that translate non-OpenAPI specs into Kubb's AST.
 *
 * Use this to support GraphQL schemas, gRPC definitions, AsyncAPI, or custom domain-specific languages.
 * Built-in adapters include `@kubb/adapter-oas` for OpenAPI and Swagger documents.
 *
 * @note Adapters must parse their input format to Kubb's `InputNode` structure.
 *
 * @example
 * ```ts
 * export const myAdapter = createAdapter<MyAdapter>((options) => {
 *   return {
 *     name: 'my-adapter',
 *     options,
 *     async parse(source) {
 *       // Transform source format to InputNode
 *       return { ... }
 *     },
 *   }
 * })
 *
 * // Instantiate:
 * const adapter = myAdapter({ validate: true })
 * ```
 */
export function createAdapter<T extends AdapterFactoryOptions = AdapterFactoryOptions>(build: AdapterBuilder<T>): (options?: T['options']) => Adapter<T> {
  return (options) => build(options ?? ({} as T['options']))
}
