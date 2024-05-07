import { pluginSwr } from './plugin.ts'

export { pluginSwr, pluginSwrName } from './plugin.ts'
export type { PluginSwr } from './types.ts'

/**
 * @deprecated Use `import { pluginSwr } from '@kubb/swagger-swr'` instead
 */
const definePluginDefault = pluginSwr
/**
 * @deprecated Use `import { pluginSwr } from '@kubb/swagger-swr'` instead
 */
export const definePlugin = pluginSwr

export default definePluginDefault
