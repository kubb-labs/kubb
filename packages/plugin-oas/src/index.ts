import type { PluginFactoryOptions } from '@kubb/core'
import { createGenerator as _createGenerator } from './generators/createGenerator.ts'
import { createReactGenerator as _createReactGenerator } from './generators/createReactGenerator.ts'
import type { Generator as _Generator } from './generators/types.ts'
import { createResolver as _createResolver, mergeResolvers as _mergeResolvers } from './resolvers/createResolver.ts'
import type { Resolver as _Resolver } from './resolvers/types.ts'

export type { CreateParserConfig, KeywordHandler } from './createParser.ts'
export { createParser, findSchemaKeyword } from './createParser.ts'
export type { OperationMethodResult } from './OperationGenerator.ts'
export { OperationGenerator } from './OperationGenerator.ts'
export { pluginOas, pluginOasName } from './plugin.ts'
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

/**
 * @deprecated use `import { createResolver } from '@kubb/plugin-oas/resolvers'`
 */
export const createResolver = _createResolver

/**
 * @deprecated use `import { mergeResolvers } from '@kubb/plugin-oas/resolvers'`
 */
export const mergeResolvers = _mergeResolvers

/**
 * @deprecated use `import { Resolver } from '@kubb/plugin-oas/resolvers'`
 */
export type Resolver<TOptions extends PluginFactoryOptions = PluginFactoryOptions> = _Resolver<TOptions>
