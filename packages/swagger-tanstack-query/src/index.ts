import { pluginTanstackQuery } from './plugin.ts'

export { pluginTanstackQuery, pluginTanstackQueryName } from './plugin.ts'
export type { PluginTanstackQuery } from './types.ts'

/**
 * @deprecated Use `import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'` instead
 */
const definePluginDefault = pluginTanstackQuery
/**
 * @deprecated Use `import { pluginTanstackQuery } from '@kubb/swagger-tanstack-query'` instead
 */
export const definePlugin = pluginTanstackQuery

export default definePluginDefault
