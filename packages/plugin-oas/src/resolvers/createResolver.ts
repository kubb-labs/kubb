import type { PluginFactoryOptions } from '@kubb/core'
import type { OperationResolverContext, Resolution, Resolver, SchemaResolverContext } from './types.ts'

type UserResolver<TOptions extends PluginFactoryOptions> = {
  name: string
  operation?: (props: OperationResolverContext) => Resolution<TOptions> | null
  schema?: (props: SchemaResolverContext) => Resolution<TOptions> | null
}

/**
 * Creates a typed resolver with operation and schema handlers
 */
export function createResolver<TOptions extends PluginFactoryOptions>(resolver: UserResolver<TOptions>): Resolver<TOptions> {
  return {
    operation() {
      return null
    },
    schema() {
      return null
    },
    ...resolver,
  }
}

/**
 * Merges custom resolvers with defaults
 * Custom resolvers have higher priority (come first in array)
 */
export function mergeResolvers<TOptions extends PluginFactoryOptions>(
  customResolvers: Array<Resolver<TOptions>> | undefined,
  defaultResolvers: Array<Resolver<TOptions>>,
): Array<Resolver<TOptions>> {
  return [...(customResolvers ?? []), ...defaultResolvers]
}

/**
 * Executes resolvers and returns first matching resolution
 */
export function executeResolvers<TOptions extends PluginFactoryOptions>(
  resolvers: Array<Resolver<TOptions>>,
  props: SchemaResolverContext | OperationResolverContext,
): Resolution<TOptions> | null {
  if ('schema' in props) {
    for (const resolver of resolvers) {
      const result = resolver.schema(props)
      if (result) {
        return result
      }
    }
  }

  if ('operation' in props) {
    for (const resolver of resolvers) {
      const result = resolver.operation(props)
      if (result) {
        return result
      }
    }
  }

  return null
}
