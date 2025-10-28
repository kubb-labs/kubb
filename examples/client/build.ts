import { build } from '@kubb/core'
import { write } from '@kubb/core/fs'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { createFile, FileProcessor } from '@kubb/react'

async function run() {
  const fileProcessor = new FileProcessor()

  const { files } = await build({
    config: {
      root: '.',
      input: {
        path: './petStore.yaml',
      },
      output: {
        path: './src/gen2',
      },
      plugins: [pluginOas(), pluginClient()],
    },
  })

  console.log('Files: ', files.length)

  for await (const file of files) {
    const source = await fileProcessor.parse(createFile(file))

    await write(source, file.path)
  }
}

run()
