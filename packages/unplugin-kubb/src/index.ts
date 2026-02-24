import { createUnplugin } from 'unplugin'
import { unpluginFactory } from './unpluginFactory.ts'

export type { Options } from './types.ts'
export { unpluginFactory } from './unpluginFactory.ts'

const plugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export { plugin as unplugin }
export { plugin as default }
