import type { Options } from './types.ts'
import vitePlugin from './vite.ts'

export default (options: Options): any => ({
  name: 'unplugin-kubb',
  hooks: {
    'astro:config:setup': async (astro: any) => {
      astro.config.vite.plugins ||= []
      astro.config.vite.plugins.push(vitePlugin(options))
    },
  },
})
