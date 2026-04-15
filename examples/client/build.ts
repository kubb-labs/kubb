import { adapterOas } from '@kubb/adapter-oas'
import { createKubb } from '@kubb/core'
import { parserTs } from '@kubb/parser-ts'
import { pluginOas } from '@kubb/plugin-oas'

async function run() {
  const kubb = createKubb({
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
  await kubb.build()
}

run()
