import type { PossiblePromise } from '@internals/utils'
import type { InputNode } from '@kubb/ast'
import { defineExtension } from './defineExtension.ts'
import type { ExtensionFactory, ExtensionMeta } from './defineExtension.ts'
import type { DiagnosticLocation } from './Diagnostics.ts'

/**
 * Source data handed to an adapter's `parse` function. Mirrors the config
 * input shape with paths resolved to absolute.
 *
 * - `{ type: 'path' }`: single file on disk.
 * - `{ type: 'data' }`: raw string or parsed object provided inline. `root` is the folder that
 *   relative external `$ref`s in it resolve from.
 */
export type AdapterSource = { type: 'path'; path: string } | { type: 'data'; data: string | unknown; root?: string }

/**
 * Generic parameters used by `defineExtension` with `kind: 'adapter'` and the resulting `Adapter` type.
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
 *   input: './petStore.yaml',
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
  meta?: ExtensionMeta<TOptions['name']>
  /**
   * The options the adapter was created with, before `setup` applied defaults, as a plugin keeps its
   * own. Kubb Studio merges its overrides onto these, so a default derived from another option, such
   * as `emptySchemaType` from `unknownType`, follows a change to it.
   */
  options: TOptions['options']
  /**
   * Parsed source document after the first `parse()` call. `null` before parsing.
   */
  document: TOptions['document'] | null
  /**
   * The files and URLs the last `parse()` read, such as the ones external `$ref`s point at, including
   * any that could not be read. Inline data is not listed. A watcher rebuilds when one of them changes.
   */
  sources?: Array<string>
  /**
   * Parse the source into a universal `InputNode`.
   *
   * An adapter that renames schemas (e.g. collision handling) must stamp `targetName` on
   * every ref node pointing at a renamed schema, so `resolveRefName` and `resolver.imports`
   * resolve a `$ref` to the file that is actually generated. Refs that keep their pointer's
   * last segment need no stamp.
   */
  parse: (source: AdapterSource, options?: { signal?: AbortSignal }) => PossiblePromise<InputNode>
  /**
   * Validate the document at the given path or URL.
   */
  validate: (input: string, options?: { throwOnError?: boolean }) => Promise<void>
  /**
   * Waits for work `parse` left running alongside generation, such as spec validation in a worker thread.
   * Kubb awaits it before `kubb:build:end`, inside the build's diagnostics scope. Must not reject.
   */
  settle?: () => Promise<void>
  /**
   * Zero-based UTF-16 offsets of a diagnostic in `source` for a code frame, `end` exclusive; `undefined` when it cannot be found.
   */
  locate?: (source: string, location: DiagnosticLocation) => { start: number; end: number } | undefined
}

/**
 * The object passed to `defineExtension` with `kind: 'adapter'`.
 */
export type AdapterDefinition<T extends AdapterFactoryOptions = AdapterFactoryOptions> = {
  meta: ExtensionMeta<T['name']>
  /**
   * Takes the user's options and returns the resolved options, which `build` receives and the adapter exposes as `options`.
   * Without `setup`, the user's options are the resolved options.
   */
  setup?(options: T['options']): T['resolvedOptions']
  /**
   * Returns the adapter's document and methods for the resolved options.
   */
  build(options: T['resolvedOptions']): Omit<Adapter<T>, 'name' | 'meta' | 'options'>
}

/**
 * The function `defineExtension` returns for an adapter. Call it with user options to get an `Adapter`.
 */
export type AdapterFactory<T extends AdapterFactoryOptions = AdapterFactoryOptions> = ExtensionFactory<'adapter', T['options'], Adapter<T>, T['name']>

/**
 * Defines a custom adapter that translates a spec format into Kubb's universal
 * AST, for example GraphQL, gRPC, or AsyncAPI. The built-in `@kubb/adapter-oas`
 * handles OpenAPI/Swagger documents.
 *
 * Adapters must return an `InputNode` from `parse`. That node is what every
 * plugin in the build consumes.
 *
 * @deprecated Use `defineExtension` with `kind: 'adapter'` instead.
 */
export function createAdapter<T extends AdapterFactoryOptions = AdapterFactoryOptions>(definition: AdapterDefinition<T>): AdapterFactory<T> {
  return defineExtension({ kind: 'adapter', ...definition })
}
