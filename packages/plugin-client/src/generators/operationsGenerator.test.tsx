import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { OperationNode } from '@kubb/ast/types'
import { renderOperations } from '@kubb/core'
import { parse } from '@kubb/oas'
import { OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import type { PluginClient } from '../types.ts'
import { operationsGenerator } from './operationsGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('operationsGenerator operations', async () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const testData = [
    {
      name: 'findByTags',
      input: '../../mocks/petStore.yaml',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
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
      clientType: 'function',
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

    const oasOperations = await generator.getOperations()

    // Map OAS operations to OperationNode for the v2 generator
    const operationNodes: Array<OperationNode> = oasOperations.map(({ operation }) => ({
      kind: 'Operation',
      operationId: operation.getOperationId(),
      method: operation.method.toUpperCase() as OperationNode['method'],
      path: operation.path,
      tags: operation.getTags().map((t) => t.name),
      parameters: [],
      responses: [],
    }))

    const adapter = createMockedAdapter()

    await renderOperations(operationNodes, {
      options: plugin.options,
      resolver: undefined as never,
      adapter,
      config: { root: '.', output: { path: 'test' } } as Parameters<typeof renderOperations>[1]['config'],
      fabric,
      Component: operationsGenerator.Operations,
      plugin,
      driver: mockedPluginDriver,
    })

    await matchFiles(fabric.files, props.name)
  })
})
