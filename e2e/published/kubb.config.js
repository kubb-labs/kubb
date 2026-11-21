import { adapterOas } from '@kubb/adapter-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { defineConfig } from 'kubb/config'

export default defineConfig({
  root: '.',
  input: './petStore.yaml',
  adapter: adapterOas(),
  output: {
    path: './gen',
    clean: true,
    format: false,
    lint: false,
  },
  plugins: [pluginTs({ output: { path: './types' } }), pluginZod({ output: { path: './zod' } })],
})
