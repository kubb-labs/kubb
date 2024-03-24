import { definePlugin } from './plugin.ts'

export { OasBuilder } from './OasBuilder.ts'
export { OasManager } from './OasManager.ts'
export type { GetOperationGeneratorOptions, OperationMethodResult } from './OperationGenerator.ts'
export { OperationGenerator } from './OperationGenerator.ts'
export { definePlugin, pluginKey, pluginName } from './plugin.ts'
export type { SchemaGeneratorBuildOptions, SchemaGeneratorOptions } from './SchemaGenerator.ts'
export type { SchemaMethodResult } from './SchemaGenerator.ts'
export { SchemaGenerator } from './SchemaGenerator.ts'
export type { Schema, SchemaKeyword, SchemaKeywordBase, SchemaKeywordMapper, SchemaMapper } from './SchemaMapper.ts'
export { isKeyword, schemaKeywords } from './SchemaMapper.ts'
export type * from './types.ts'

/**
 * @deprecated Use `import { definePlugin } from '@kubb/swagger'`
 */
const definePluginDefault = definePlugin

export default definePluginDefault
