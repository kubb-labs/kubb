import type { Config, PluginFactoryOptions } from '@kubb/core'
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
 * @typeParam TOptions - PluginFactoryOptions containing outputKeys
 */
export interface Resolution<TOptions extends PluginFactoryOptions = PluginFactoryOptions> {
  /** Default file for outputs that don't specify their own */
  file: FileDescriptor
  /** Named outputs with typesafe keys */
  outputs: Record<TOptions['outputKeys'], Output>
}

/**
 * Context for operation resolution
 */
export interface OperationResolverContext {
  /** The OpenAPI operation */
  operation: Operation
  /** The Kubb configuration */
  config: Config
}

/**
 * Context for schema resolution
 */
export interface SchemaResolverContext {
  /** The schema name and value */
  schema: { name: string; value: SchemaObject }
  /** The Kubb configuration */
  config: Config
}

/**
 * @deprecated Use OperationResolverContext or SchemaResolverContext instead
 * Legacy context type for backwards compatibility
 */
export type ResolverContext = {
  operation?: Operation
  schema?: { name: string; value: SchemaObject }
}

/**
 * Resolver configuration for a plugin
 * @typeParam TOptions - PluginFactoryOptions containing outputKeys
 */
export interface ResolverConfig<TOptions extends PluginFactoryOptions = PluginFactoryOptions> {
  /** Array of resolvers, executed in order until one matches */
  resolvers?: Array<Resolver<TOptions>>
}

/**
 * Core resolver interface
 * @typeParam TOptions - PluginFactoryOptions containing outputKeys
 */
export interface Resolver<TOptions extends PluginFactoryOptions = PluginFactoryOptions> {
  /** Unique name for this resolver */
  name: string
  /** Resolution function for operations */
  operation: (props: OperationResolverContext) => Resolution<TOptions> | null
  /** Resolution function for schemas */
  schema: (props: SchemaResolverContext) => Resolution<TOptions> | null
}
