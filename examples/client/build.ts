import path from 'node:path'
import { build } from '@kubb/core'
import { pluginOas } from '@kubb/plugin-oas'
import { createFabric } from '@kubb/react-fabric'
import { typescriptParser } from '@kubb/react-fabric/parsers'
import { fsPlugin } from '@kubb/react-fabric/plugins'

async function run() {
  const fabric = createFabric()

  const { files } = await build({
    config: {
      input: {
        path: './petStore.yaml',
      },
      output: {
        path: './src/gen2',
      },
      plugins: [pluginOas()],
    },
  })

  fabric.addFile(...files)

  fabric.use(fsPlugin, { clean: { path: path.join(process.cwd(), './src/gen2') } })
  fabric.use(typescriptParser)

  console.log('Files: ', fabric.files.length)

  await fabric.write()
}

run()
