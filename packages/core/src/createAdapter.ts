import type { PossiblePromise } from '@internals/utils'
import type { InputNode } from '@kubb/ast'
import { defineExtension } from './defineExtension.ts'
import type { ExtensionFactory, ExtensionMeta } from './defineExtension.ts'
import type { StandardSchemaV1 } from './standardSchema.ts'

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
 * - `TParsedOptions`: options after the options `schema` parsed them, with its defaults applied.
 */
export type AdapterFactoryOptions<
  TName extends string = string,
  TOptions extends object = object,
  TResolvedOptions extends object = TOptions,
  TDocument = unknown,
  TParsedOptions extends object = TOptions,
> = {
  name: TName
  options: TOptions
  parsedOptions: TParsedOptions
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
   * Resolved adapter options after defaults have been applied.
   */
  options: TOptions['resolvedOptions']
  /**
   * The options schema of the definition that built this adapter.
   */
  schema?: StandardSchemaV1<TOptions['options'], TOptions['parsedOptions']>
  /**
   * Parsed source document after the first `parse()` call. `null` before parsing.
   */
  document: TOptions['document'] | null
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
}

type AdapterBuilder<T extends AdapterFactoryOptions> = (options: T['options']) => Adapter<T>

/**
 * The object passed to `createAdapter`.
 */
export type AdapterDefinition<T extends AdapterFactoryOptions = AdapterFactoryOptions> = {
  meta: ExtensionMeta<T['name']>
  /**
   * Any Standard Schema, such as a Zod schema, that validates the options and applies their defaults
   * when the factory is called. Invalid options throw `KUBB_INVALID_OPTIONS`. The schema must validate synchronously.
   */
  schema?: StandardSchemaV1<T['options'], T['parsedOptions']>
  /**
   * Takes the parsed options and returns the resolved options, which `build` receives and the adapter exposes as `options`.
   * Without `setup`, the parsed options are the resolved options.
   */
  setup?(options: T['parsedOptions']): T['resolvedOptions']
  /**
   * Returns the adapter's document and methods for the resolved options.
   */
  build(options: T['resolvedOptions']): Omit<Adapter<T>, 'name' | 'meta' | 'options' | 'schema'>
}

/**
 * The function `createAdapter` returns. Call it with user options to get an `Adapter`.
 */
export type AdapterFactory<T extends AdapterFactoryOptions = AdapterFactoryOptions> = ExtensionFactory<
  'adapter',
  T['options'],
  Adapter<T>,
  T['name'],
  T['parsedOptions']
>

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
 * type MyAdapter = AdapterFactoryOptions<'my-adapter', { validate?: boolean }, { validate: boolean }>
 *
 * export const myAdapter = createAdapter<MyAdapter>({
 *   meta: { name: 'my-adapter', compatibility: { kubb: '>=5.7.0' } },
 *   setup: (options) => ({ validate: options.validate ?? true }),
 *   build: (options) => ({
 *     document: null,
 *     async parse(_source) {
 *       // Convert the source (path or inline data) into an InputNode.
 *       return ast.factory.createInput()
 *     },
 *     async validate() {
 *       // Throw here when `options.validate` is set and the spec is invalid.
 *     },
 *   }),
 * })
 * ```
 */
export function createAdapter<T extends AdapterFactoryOptions = AdapterFactoryOptions>(definition: AdapterDefinition<T>): AdapterFactory<T>
/**
 * Wraps a factory function that returns an `Adapter`.
 *
 * @deprecated Pass a definition object with `meta` and `build` instead. The factory form is removed in the next major.
 */
export function createAdapter<T extends AdapterFactoryOptions = AdapterFactoryOptions>(
  build: AdapterBuilder<T>,
): ((options?: T['options']) => Adapter<T>) & { kind: 'adapter' }
export function createAdapter(input: AdapterDefinition | AdapterBuilder<AdapterFactoryOptions>) {
  if (typeof input === 'function') {
    return defineExtension({ kind: 'adapter', build: ({ options }: { options: object }): Adapter => input(options) })
  }

  const { meta, schema, setup, build } = input
  return defineExtension({
    kind: 'adapter',
    meta,
    schema,
    build: ({ parsedOptions }: { options: object; parsedOptions: object }): Adapter => {
      const options = setup ? setup(parsedOptions) : parsedOptions
      // Assigned onto the built object instead of spread, so getters such as `document` stay live.
      return Object.assign(build(options), { name: meta.name, meta, options }, schema && { schema })
    },
  })
}
