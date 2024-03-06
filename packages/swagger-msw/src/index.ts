import { definePlugin } from './plugin.ts'

export { definePlugin, pluginKey, pluginName } from './plugin.ts'
export type * from './types.ts'

/**
 * @deprecated Use `import { definePlugin } from '@kubb/swagger-msw'`
 */
const definePluginDefault = definePlugin

export default definePluginDefault
