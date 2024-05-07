import { pluginFaker } from './plugin.ts'

export { pluginFaker, pluginFakerName } from './plugin.ts'
export type { PluginFaker } from './types.ts'

/**
 * @deprecated Use `import { pluginFaker } from '@kubb/swagger-faker'` instead
 */
const definePluginDefault = pluginFaker
/**
 * @deprecated Use `import { pluginFaker } from '@kubb/swagger-faker'` instead
 */
export const definePlugin = pluginFaker

export default definePluginDefault
