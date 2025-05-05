import { build, getSource } from '@kubb/core'
import { write } from '@kubb/core/fs'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'

async function run() {
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

  for (const file of files) {
    const source = await getSource(file)

    await write(source, file.path)
  }
}

run()
