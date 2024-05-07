import { pluginZod } from './plugin.ts'

export { pluginZod, pluginZodName } from './plugin.ts'
export type { PluginZod } from './types.ts'

/**
 * @deprecated Use `import { pluginZod } from '@kubb/swagger-zod'` instead
 */
const definePluginDefault = pluginZod
/**
 * @deprecated Use `import { pluginZod } from '@kubb/swagger-zod'` instead
 */
export const definePlugin = pluginZod

export default definePluginDefault
