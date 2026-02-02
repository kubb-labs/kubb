import type { PluginFactoryOptions } from '@kubb/core'
import { createGenerator as _createGenerator } from './generators/createGenerator.ts'
import { createReactGenerator as _createReactGenerator } from './generators/createReactGenerator.ts'
import type { Generator as _Generator } from './generators/types.ts'

export type { CreateParserConfig, KeywordHandler } from './createParser.ts'
export { createParser, findSchemaKeyword } from './createParser.ts'
// Re-export resolver registration from hooks for convenience
export { getDefaultResolvers, hasDefaultResolver, registerDefaultResolvers } from './hooks/useResolve.ts'
export type { OperationMethodResult } from './OperationGenerator.ts'
export { OperationGenerator } from './OperationGenerator.ts'
export { pluginOas, pluginOasName } from './plugin.ts'
// Resolver exports
export type {
  FileDescriptor,
  Output,
  Resolution,
  Resolver,
  ResolverConfig,
  ResolverContext,
} from './resolvers/index.ts'
export { buildResolverContext, createResolver, executeResolvers, mergeResolvers } from './resolvers/index.ts'
export type {
  GetSchemaGeneratorOptions,
  SchemaGeneratorBuildOptions,
  SchemaGeneratorOptions,
  SchemaMethodResult,
} from './SchemaGenerator.ts'
export { SchemaGenerator } from './SchemaGenerator.ts'
export type {
  Schema,
  SchemaKeyword,
  SchemaKeywordBase,
  SchemaKeywordMapper,
  SchemaMapper,
  SchemaTree,
} from './SchemaMapper.ts'
export { isKeyword, schemaKeywords } from './SchemaMapper.ts'
export type * from './types.ts'
export { buildOperation, buildOperations, buildSchema } from './utils.tsx'

/**
 * @deprecated use `import { createGenerator } from '@kubb/plugin-oas/generators'`
 */
export const createGenerator = _createGenerator

/**
 * @deprecated use `import { createReactGenerator } from '@kubb/plugin-oas/generators'`
 */
export const createReactGenerator = _createReactGenerator

/**
 * @deprecated use `import { Generator } from '@kubb/plugin-oas/generators'`
 */
export type Generator<TOptions extends PluginFactoryOptions> = _Generator<TOptions>
