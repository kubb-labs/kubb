import { pluginClient } from './plugin.ts'

export { pluginClient, pluginClientName } from './plugin.ts'
export type { PluginClient } from './types.ts'

/**
 * @deprecated Use `import { pluginClient } from '@kubb/swagger-client'` instead
 */
const definePluginDefault = pluginClient
/**
 * @deprecated Use `import { pluginClient } from '@kubb/swagger-client'` instead
 */
export const definePlugin = pluginClient

export default definePluginDefault
