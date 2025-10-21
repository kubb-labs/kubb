import { build } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'

async function run() {
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  // @ts-expect-error
  const { files } = await build({
    config: {
      root: '.',
      input: {
        data: '',
      },
      output: {
        path: './gen',
      },
      plugins: [pluginOas(), pluginClient()],
    },
  })
  //TODO add fabric
}

run()
