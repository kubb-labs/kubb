import { definePlugin } from './plugin.ts'

export type { RequestConfig } from '../client.ts'
export { definePlugin, pluginKey, pluginName } from './plugin.ts'
export * from './types.ts'

export default definePlugin
