import { pluginTs } from './plugin.ts'

export { pluginTs, pluginTsName } from './plugin.ts'
export type { PluginTs } from './types.ts'

/**
 * @deprecated Use `import { pluginTs } from '@kubb/swagger-ts'` instead
 */
const definePluginDefault = pluginTs
/**
 * @deprecated Use `import { pluginTs } from '@kubb/swagger-ts'` instead
 */
export const definePlugin = pluginTs

export default definePluginDefault
