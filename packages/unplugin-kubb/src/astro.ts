import type { Options } from './types.ts'
import vitePlugin from './vite.ts'

type AstroConfigSetup = { config: { vite: { plugins?: Array<unknown> } } }

export default (options: Options) => ({
  name: 'unplugin-kubb',
  hooks: {
    'astro:config:setup': async (astro: AstroConfigSetup) => {
      astro.config.vite.plugins ||= []
      astro.config.vite.plugins.push(vitePlugin(options))
    },
  },
})
