import { adapterOas } from '@kubb/adapter-oas'
import { defineConfig } from 'kubb'
import { parserTs } from '@kubb/parser-ts'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'

export default defineConfig({
  root: '.',
  input: {
    path: './openapi.yaml',
  },
  output: {
    path: './src/gen',
    clean: true,
    write: false,
  },
  adapter: adapterOas({}),
  parsers: [parserTs],
  plugins: [
    pluginOas(),
    pluginTs({
      output: {
        path: 'models',
      },
    }),
  ],
})
