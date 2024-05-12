import { pluginOas } from './plugin.ts'

export type {
  GetOperationGeneratorOptions,
  OperationMethodResult,
} from './OperationGenerator.ts'
export { OperationGenerator } from './OperationGenerator.ts'
export { pluginOas, pluginOasName } from './plugin.ts'
export type {
  GetSchemaGeneratorOptions,
  SchemaGeneratorBuildOptions,
  SchemaGeneratorOptions,
} from './SchemaGenerator.ts'
export type { SchemaMethodResult } from './SchemaGenerator.ts'
export { SchemaGenerator } from './SchemaGenerator.ts'
export type {
  Schema,
  SchemaKeyword,
  SchemaKeywordBase,
  SchemaKeywordMapper,
  SchemaMapper,
} from './SchemaMapper.ts'
export { isKeyword, schemaKeywords } from './SchemaMapper.ts'
export type * from './types.ts'

/**
 * @deprecated Use `import { pluginOas } from '@kubb/plugin-oas'` instead
 */
const definePluginDefault = pluginOas

export default definePluginDefault
