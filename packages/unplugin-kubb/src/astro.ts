import type { Options } from './types.ts'
import vitePlugin from './vite.ts'

/**
 * Minimal shape of the params Astro passes to its `astro:config:setup` hook.
 * Kept local rather than depending on `astro` for a single hook signature.
 */
type AstroConfigSetupParams = {
  config: {
    vite: {
      plugins?: Array<unknown>
    }
  }
}

type AstroIntegration = {
  name: string
  hooks: {
    'astro:config:setup': (params: AstroConfigSetupParams) => void | Promise<void>
  }
}

export default (options: Options): AstroIntegration => ({
  name: 'unplugin-kubb',
  hooks: {
    'astro:config:setup': async (astro) => {
      astro.config.vite.plugins ||= []
      astro.config.vite.plugins.push(vitePlugin(options))
    },
  },
})
