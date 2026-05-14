import type { PossiblePromise } from '@internals/utils'
import type { ImportNode, InputNode, OperationNode, SchemaNode } from '@kubb/ast'
import type { Storage } from './createStorage.ts'

/**
 * Source data passed to an adapter's `parse` function.
 * Mirrors the config input shape with paths resolved to absolute.
 */
export type AdapterSource = { type: 'path'; path: string } | { type: 'data'; data: string | unknown } | { type: 'paths'; paths: Array<string> }

/**
 * Runtime context handed to {@link Adapter.parse}. Provides access to the
 * shared `config.storage` (used for caching parsed nodes to disk) and the
 * resolved project root so adapters can scope storage keys.
 */
export type AdapterParseContext = {
  /**
   * Storage shared with output file emission. Adapters that stream nodes must
   * write under a reserved key prefix (e.g. `<root>/.kubb/.cache/...`).
   */
  storage: Storage
  /**
   * Absolute project root (`config.root`).
   */
  root: string
}

/**
 * Streaming view over schemas and operations exposed by an adapter that
 * persists nodes outside the `InputNode`. Implementations are free to read
 * each node from disk on demand so peak memory stays bounded; consumers must
 * never assume `Symbol.asyncIterator` is multi-shot — re-walks should rely on
 * `loadSchema` / `loadOperation` or re-iterate via the returned iterables.
 *
 * Each yielded node is a plain `SchemaNode` / `OperationNode` (JSON-safe), so
 * the AST primitives in `@kubb/ast` remain serializable.
 */
export type AdapterStreamSource = {
  /**
   * Streams every schema node in source order.
   */
  schemas: AsyncIterable<SchemaNode>
  /**
   * Streams every operation node in source order.
   */
  operations: AsyncIterable<OperationNode>
  /**
   * Stable schema names in source order.
   */
  schemaNames: ReadonlyArray<string>
  /**
   * Stable operation identifiers in source order.
   */
  operationIds: ReadonlyArray<string>
  /**
   * Total number of schemas.
   */
  schemaCount: number
  /**
   * Total number of operations.
   */
  operationCount: number
  /**
   * Random-access loader for a schema by name. Returns `undefined` when missing.
   */
  loadSchema(name: string): Promise<SchemaNode | undefined>
  /**
   * Random-access loader for an operation by id. Returns `undefined` when missing.
   */
  loadOperation(id: string): Promise<OperationNode | undefined>
  /**
   * Optional cleanup hook called by `createKubb` after the build completes.
   * Adapters that persist nodes to `config.storage` should remove their own
   * cache namespace here instead of clearing the whole `.kubb/.cache` tree.
   */
  dispose?(): Promise<void>
}

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
  inputNode: InputNode | null
  /**
   * Streaming view over schemas / operations when the adapter persists nodes
   * outside the `InputNode` (typically to `config.storage` under
   * `.kubb/.cache`). When set, `createKubb` walks this source instead of
   * iterating `inputNode.schemas` / `inputNode.operations` directly.
   *
   * `null` (or unset) means the adapter materialized everything into
   * `inputNode` and there is no streaming view.
   */
  source?: AdapterStreamSource | null
  /**
   * Parse the source into a universal `InputNode`.
   *
   * The optional `context` is supplied by `createKubb` and exposes
   * `config.storage` so adapters can persist parsed schemas / operations to
   * disk and expose them via `Adapter.source`.
   */
  parse: (source: AdapterSource, context?: AdapterParseContext) => PossiblePromise<InputNode>
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
