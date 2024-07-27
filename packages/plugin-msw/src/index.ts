import { pluginMsw } from './plugin.ts'

export { pluginMsw, pluginMswName } from './plugin.ts'
export type { PluginMsw } from './types.ts'

/**
 * @deprecated Use `import { pluginMsw } from '@kubb/plugin-msw'` instead
 */
const definePluginDefault = pluginMsw
/**
 * @deprecated Use `import { pluginMsw } from '@kubb/plugin-msw'` instead
 */
export const definePlugin = pluginMsw

export default definePluginDefault
