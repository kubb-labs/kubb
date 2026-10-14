import type { Options } from './unpluginFactory.ts'
import vitePlugin from './vite.ts'

export default (options: Options) => ({
  name: 'unplugin-kubb',
  hooks: {
    // Only the slice of Astro's `astro:config:setup` params the integration touches, so `astro` is not a dependency.
    'astro:config:setup': (astro: { config: { vite: { plugins?: Array<unknown> } } }) => {
      astro.config.vite.plugins ||= []
      astro.config.vite.plugins.push(vitePlugin(options))
    },
  },
})
