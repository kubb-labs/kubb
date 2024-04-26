import { addVitePlugin, addWebpackPlugin, defineNuxtModule } from '@nuxt/kit'
import '@nuxt/schema'

import vite from './vite.ts'
import webpack from './webpack.ts'

import type { Options } from './types.ts'

export interface ModuleOptions extends Options {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-unplugin-starter',
    configKey: 'unpluginStarter',
  },
  defaults: undefined,
  setup(options, _nuxt) {
    addVitePlugin(() => vite(options))
    addWebpackPlugin(() => webpack(options))

    // ...
  },
})
