import { addRspackPlugin, addVitePlugin, addWebpackPlugin, defineNuxtModule } from '@nuxt/kit'
import '@nuxt/schema'

import rspack from './rspack.ts'
import type { Options } from './unpluginFactory.ts'
import vite from './vite.ts'
import webpack from './webpack.ts'

export type ModuleOptions = Options

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-unplugin-kubb',
    configKey: 'unpluginKubb',
  },
  defaults: undefined,
  setup(options, _nuxt) {
    // Nuxt builds the client before the server, so generating in the client build alone gives
    // the server build the files too. Skip the dev server, as the Vite integration does.
    const buildOptions = { dev: false, server: false }

    addVitePlugin(() => vite(options), buildOptions)
    addWebpackPlugin(() => webpack(options), buildOptions)
    addRspackPlugin(() => rspack(options), buildOptions)
  },
})
