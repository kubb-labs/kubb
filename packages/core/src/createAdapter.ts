import type { Adapter, AdapterFactoryOptions } from './types.ts'

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
