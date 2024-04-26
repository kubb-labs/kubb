import { definePlugin } from './plugin.ts'

export { definePlugin, pluginKey, pluginName } from './plugin.ts'
export type { PluginOptions } from './types.ts'

/**
 * @deprecated Use `import { definePlugin } from '@kubb/swagger-client'`
 */
const definePluginDefault = definePlugin

export default definePluginDefault
