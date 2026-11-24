import { defineConfig } from 'tsdown'
import { packageBuilds } from '../../configs/tsdown.ts'

const cjsEntry = {
  index: 'src/index.ts',
  config: 'src/config.ts',
  kit: 'src/kit.ts',
  jsx: 'src/jsx.ts',
  'jsx/jsx-runtime': 'src/jsx/jsx-runtime.ts',
  'jsx/jsx-dev-runtime': 'src/jsx/jsx-dev-runtime.ts',
}

export default defineConfig(
  packageBuilds({
    entry: {
      ...cjsEntry,
      astro: 'src/astro.ts',
      esbuild: 'src/esbuild.ts',
      farm: 'src/farm.ts',
      nuxt: 'src/nuxt.ts',
      rolldown: 'src/rolldown.ts',
      rollup: 'src/rollup.ts',
      rspack: 'src/rspack.ts',
      vite: 'src/vite.ts',
      webpack: 'src/webpack.ts',
    },
    // The bundler integrations re-export the ESM-only unplugin-kubb, so they stay ESM-only.
    cjsEntry,
  }),
)
