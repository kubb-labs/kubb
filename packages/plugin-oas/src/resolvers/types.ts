import type { Operation, SchemaObject } from '@kubb/oas'

/**
 * File location descriptor
 */
export interface FileDescriptor {
  baseName: string
  path: string
}

/**
 * A single output artifact
 */
export interface Output {
  /** The identifier used in code (e.g., "useGetPetById", "get_pet_by_id") */
  name: string
  /** Optional file override - if not set, uses Resolution.file */
  file?: FileDescriptor
}

/**
 * Resolution result - contains default file and typed outputs
 * @typeParam TOutputKeys - String literal union of output keys
 */
export interface Resolution<TOutputKeys extends string = string> {
  /** Default file for outputs that don't specify their own */
  file: FileDescriptor
  /** Named outputs with typesafe keys */
  outputs: Record<TOutputKeys, Output>
}

/**
 * Context passed to resolver functions
 */
export interface ResolverContext {
  /** The OpenAPI operation (for operation-based resolution) */
  operation?: Operation
  /** The schema (for schema-based resolution) */
  schema?: { name: string; value: SchemaObject }
}

/**
 * Resolver definition
 * @typeParam TOutputKeys - String literal union of output keys
 */
export interface Resolver<TOutputKeys extends string = string> {
  /** Unique name for this resolver */
  name: string
  /** Optional matcher - if returns false, resolver is skipped */
  match?: (ctx: ResolverContext) => boolean
  /** Resolution function */
  resolve: (ctx: ResolverContext) => Resolution<TOutputKeys>
}

/**
 * Resolver configuration for a plugin
 * @typeParam TOutputKeys - String literal union of output keys
 */
export interface ResolverConfig<TOutputKeys extends string = string> {
  /** Array of resolvers, executed in order until one matches */
  resolvers?: Array<Resolver<TOutputKeys>>
}
