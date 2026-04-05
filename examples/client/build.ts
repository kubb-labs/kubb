import { adapterOas } from '@kubb/adapter-oas'
import { build } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginOas } from '@kubb/plugin-oas'

async function run() {
  await build({
    config: {
      input: {
        path: './petStore.yaml',
      },
      output: {
        path: './src/gen2',
        clean: true,
      },
      adapter: adapterOas(),
      parsers: [parserTs],
      plugins: [pluginOas()],
    },
  })
}

run()
