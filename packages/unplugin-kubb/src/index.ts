import { createUnplugin } from 'unplugin'
import { unpluginFactory } from './unpluginFactory.ts'

export { configFileCandidates, findConfigFile, loadConfigFile } from '@internals/shared'
export { generateModule, selectConfig } from './generateModule.ts'
export { applyDefaults, type Options, unpluginFactory } from './unpluginFactory.ts'

const plugin = /* #__PURE__ */ createUnplugin(unpluginFactory)

export { plugin as unplugin, plugin as default }
