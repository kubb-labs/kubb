import type { PluginFactoryOptions } from '@kubb/core'
import { createGenerator as _createGenerator } from './generators/createGenerator.ts'
import { createReactGenerator as _createReactGenerator } from './generators/createReactGenerator.ts'
import type { Generator as _Generator } from './generators/types.ts'

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
export { resolveOptions } from './utils/resolveOptions.ts'

/**
 * @deprecated Use `import { defineGenerator } from '@kubb/core'`
 */
export const createGenerator = _createGenerator

/**
 * @deprecated Use `import { defineGenerator } from '@kubb/core'`
 */
export const createReactGenerator = _createReactGenerator

/**
 * @deprecated use `import { Generator } from '@kubb/core'`
 */
export type Generator<TOptions extends PluginFactoryOptions, TVersion extends import('./generators/types.ts').Version = '1'> = _Generator<TOptions, TVersion>
