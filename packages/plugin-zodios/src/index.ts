import { pluginZodios } from './plugin.ts'

export { pluginZodios, pluginZodiosName } from './plugin.ts'
export type { PluginZodios } from './types.ts'

/**
 * @deprecated Use `import { pluginZodios } from '@kubb/plugin-zodios'` instead
 */
const definePluginDefault = pluginZodios
/**
 * @deprecated Use `import { pluginZodios } from '@kubb/plugin-zodios'` instead
 */
export const definePlugin = pluginZodios

export default definePluginDefault
