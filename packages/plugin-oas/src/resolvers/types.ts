import type { Config, PluginFactoryOptions } from '@kubb/core'
import type { KubbFile } from '@kubb/fabric-core/types'
import type { Operation, SchemaObject } from '@kubb/oas'
/**
 * A single output artifact
 */
export interface Output {
  /** The identifier used in code (e.g., "useGetPetById", "get_pet_by_id") */
  name: string
  /** Optional file override - if not set, uses Resolution.file */
  file?: KubbFile.File
}

/**
 * Resolution result - contains default file and typed outputs
 * @typeParam TOptions - PluginFactoryOptions containing outputKeys
 */
export interface Resolution<TOptions extends PluginFactoryOptions = PluginFactoryOptions> {
  /** Default file for outputs that don't specify their own */
  file: KubbFile.File
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
 * Resolver configuration for a plugin
 */
export interface ResolverConfig<TOptions extends PluginFactoryOptions = PluginFactoryOptions> {
  /** Array of resolvers, executed in order until one matches */
  resolvers?: Array<Resolver<TOptions>>
}

/**
 * Core resolver interface
 */
export interface Resolver<TOptions extends PluginFactoryOptions = PluginFactoryOptions> {
  /** Unique name for this resolver */
  name: string
  /** Resolution function for operations */
  operation: (props: OperationResolverContext) => Resolution<TOptions> | null
  /** Resolution function for schemas */
  schema: (props: SchemaResolverContext) => Resolution<TOptions> | null
}
