import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { parse } from '@kubb/oas'
import { buildOperations, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import type { PluginClient } from '../types.ts'
import { classClientGenerator } from './classClientGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('classClientGenerator operations', async () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

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
        wrapper: {
          className: 'PetStoreClient',
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
      wrapper: undefined,
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginClient>({ name: 'plugin-client', options })
    const mockedPluginDriver = createMockedPluginDriver({ name: props.name })
    const generator = new OperationGenerator(options, {
      fabric,
      oas,
      include: undefined,
      driver: mockedPluginDriver,

      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })

    const operations = await generator.getOperations()

    await buildOperations(
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

    await matchFiles(fabric.files, props.name)
  })
})
