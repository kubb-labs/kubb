import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from '@kubb/core'
import { parse } from '@kubb/oas'
import { OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { describe, test } from 'vitest'
import { createMockedPluginManager, matchFiles } from '#mocks'
import type { PluginClient } from '../types.ts'
import { classClientGenerator } from './classClientGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('classClientGenerator operations', async () => {
  const testData = [
    {
      name: 'findByTags',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get' as const,
      options: {
        group: {
          type: 'tag' as const,
        },
      } as Partial<PluginClient['resolvedOptions']>,
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: 'get' | 'post' | 'put' | 'delete' | 'patch'
    options: Partial<PluginClient['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginClient['resolvedOptions'] = {
      dataReturnType: 'data',
      paramsType: 'inline',
      paramsCasing: undefined,
      pathParamsType: 'inline',
      client: 'axios',
      clientType: 'class',
      importPath: undefined,
      bundle: false,
      baseURL: '',
      parser: 'client',
      output: {
        path: '.',
      },
      group: undefined,
      urlType: 'export',
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginClient>
    const fabric = createReactFabric()
    const mockedPluginManager = createMockedPluginManager(props.name)
    const generator = new OperationGenerator(options, {
      fabric,
      oas,
      include: undefined,
      pluginManager: mockedPluginManager,

      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })

    const operations = await generator.getOperations()

    await (await import('@kubb/plugin-oas')).buildOperations(
      operations.map((item) => item.operation),
      {
        config: {
          root: '.',
          output: { path: 'test' },
        } as import('@kubb/core').Config,
        fabric,
        generator,
        Component: classClientGenerator.Operations,
        plugin,
      },
    )

    await matchFiles(fabric.files)
  })
})
