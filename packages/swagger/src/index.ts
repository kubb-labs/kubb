import { pluginSwagger } from './plugin.ts'

export type {
  GetOperationGeneratorOptions,
  OperationMethodResult,
} from './OperationGenerator.ts'
export { OperationGenerator } from './OperationGenerator.ts'
export { pluginSwagger, pluginSwaggerName } from './plugin.ts'
export type {
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
 * @deprecated Use `import { pluginSwagger } from '@kubb/swagger'` instead
 */
const definePluginDefault = pluginSwagger
/**
 * @deprecated Use `import { pluginSwagger } from '@kubb/swagger'` instead
 */
export const definePlugin = pluginSwagger

export default definePluginDefault
