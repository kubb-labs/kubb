import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { OperationGenerator, renderOperations } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import type { PluginMsw } from '../types.ts'
import { handlersGenerator } from './handlersGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('handlersGenerator operations', async () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const testData = [
    {
      name: 'findByTags',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginMsw['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginMsw['resolvedOptions'] = {
      output: {
        path: '.',
      },
      parser: 'data',
      baseURL: undefined,
      group: undefined,
      exclude: [],
      include: undefined,
      override: [],
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginMsw>({ name: 'plugin-msw', options })
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

    await renderOperations(
      operations.map((item) => item.operation),
      {
        config: { root: '.', output: { path: 'test' } } as Config,
        fabric,
        generator,
        Component: handlersGenerator.Operations,
        plugin,
      },
    )

    await matchFiles(fabric.files, props.name)
  })
})
