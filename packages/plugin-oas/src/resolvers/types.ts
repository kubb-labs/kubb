import type { Oas, Operation, SchemaObject } from '@kubb/oas'

/**
 * File location descriptor
 */
export interface FileDescriptor {
  /**
   * The base name of the file (e.g., "GetPetById.ts")
   */
  baseName: string
  /**
   * The full path to the file (e.g., "types/pet/GetPetById.ts")
   */
  path: string
}

/**
 * A single output artifact produced by a resolver
 */
export interface Output {
  /**
   * The identifier used in code (e.g., "useGetPetById", "get_pet_by_id")
   */
  name: string
  /**
   * Optional file override - if not set, uses Resolution.file
   * Useful when this output should be in a different file than the default
   */
  file?: FileDescriptor
}

/**
 * Resolution result - contains default file and typed outputs
 * @typeParam TOutputKeys - String literal union of output keys for type safety
 *
 * @example
 * ```ts
 * type MyOutputKeys = 'hook' | 'queryKey'
 * const resolution: Resolution<MyOutputKeys> = {
 *   file: { baseName: 'useGetPet.ts', path: 'hooks/useGetPet.ts' },
 *   outputs: {
 *     hook: { name: 'useGetPet' },
 *     queryKey: { name: 'getGetPetQueryKey' }
 *   }
 * }
 * ```
 */
export interface Resolution<TOutputKeys extends string = string> {
  /**
   * Default file for outputs that don't specify their own
   */
  file: FileDescriptor
  /**
   * Named outputs with typesafe keys
   * Each key corresponds to a specific artifact this plugin produces
   */
  outputs: Record<TOutputKeys, Output>
}

/**
 * Context passed to resolver functions
 * Contains all information needed to resolve names and paths
 */
export interface ResolverContext {
  /**
   * The OpenAPI operation (for operation-based resolution)
   */
  operation?: Operation
  /**
   * The schema (for schema-based resolution)
   */
  schema?: {
    name: string
    value: SchemaObject
  }
  /**
   * OpenAPI specification instance
   */
  oas: Oas
  /**
   * Convenience: extracted operationId
   * Automatically populated from operation.getOperationId()
   */
  operationId?: string
  /**
   * Convenience: extracted tag names
   * Automatically populated from operation.getTags()
   */
  tags?: string[]
  /**
   * Convenience: operation path (e.g., "/pets/{petId}")
   */
  path?: string
  /**
   * HTTP method (e.g., "get", "post")
   */
  method?: string
}

/**
 * Resolver definition
 * A resolver takes context and returns a Resolution with all outputs
 *
 * @typeParam TOutputKeys - String literal union of output keys for type safety
 *
 * @example
 * ```ts
 * type MyOutputKeys = 'hook' | 'queryKey'
 *
 * const myResolver: Resolver<MyOutputKeys> = {
 *   name: 'my-resolver',
 *   match: (ctx) => ctx.path?.startsWith('/admin'),
 *   resolve: (ctx) => ({
 *     file: { baseName: `${ctx.operationId}.ts`, path: `hooks/${ctx.operationId}.ts` },
 *     outputs: {
 *       hook: { name: `use${pascalCase(ctx.operationId)}` },
 *       queryKey: { name: `get${pascalCase(ctx.operationId)}QueryKey` }
 *     }
 *   })
 * }
 * ```
 */
export interface Resolver<TOutputKeys extends string = string> {
  /**
   * Unique name for this resolver (used for debugging and identification)
   */
  name: string
  /**
   * Optional matcher - if returns false, resolver is skipped
   * If not provided, resolver always matches
   * Resolvers are executed in order; first matching resolver wins
   */
  match?: (ctx: ResolverContext) => boolean
  /**
   * Resolution function that returns file and outputs for the given context
   */
  resolve: (ctx: ResolverContext) => Resolution<TOutputKeys>
}

/**
 * Resolver configuration for a plugin
 * @typeParam TOutputKeys - String literal union of output keys
 */
export interface ResolverConfig<TOutputKeys extends string = string> {
  /**
   * Array of resolvers, executed in order until one matches
   * User-provided resolvers run before default resolvers
   */
  resolvers?: Array<Resolver<TOutputKeys>>
}
