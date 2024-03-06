import { definePlugin } from './plugin.ts'

export { OasBuilder } from './OasBuilder.ts'
export { OasManager } from './OasManager.ts'
export type { GetOperationGeneratorOptions, OperationMethodResult } from './OperationGenerator.ts'
export { OperationGenerator } from './OperationGenerator.ts'
export { definePlugin, pluginKey, pluginName } from './plugin.ts'
export type * from './types.ts'

/**
 * @deprecated Use `import { definePlugin } from '@kubb/swagger'`
 */
const definePluginDefault = definePlugin

export default definePluginDefault
