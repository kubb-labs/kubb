import path from 'node:path'
import type { Plugin } from '@kubb/core'
import { createMockedPluginManager, matchFiles } from '@kubb/core/mocks'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { buildOperations, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react'
import type { PluginZod } from '../types.ts'
import { operationsGenerator } from './operationsGenerator.tsx'

describe('operationsGenerator operations', async () => {
  const testData = [
    {
      name: 'showPetById',
      input: '../../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'get',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginZod['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginZod['resolvedOptions'] = {
      dateType: 'date',
      transformers: {},
      inferred: false,
      typed: false,
      unknownType: 'any',
      mapper: {},
      importPath: 'zod',
      coercion: false,
      operations: false,
      override: [],
      output: {
        path: '.',
      },
      group: undefined,
      wrapOutput: undefined,
      version: '4',
      emptySchemaType: 'unknown',
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginZod>
    const fabric = createReactFabric()
    const instance = new OperationGenerator(options, {
      fabric,
      oas,
      include: undefined,
      pluginManager: createMockedPluginManager(props.name),
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })
    await instance.build(operationsGenerator)

    const operations = await instance.getOperations()

    await buildOperations(
      operations.map((item) => item.operation),
      {
        fabric,
        instance,
        generator: operationsGenerator,
        options,
      },
    )

    await matchFiles(fabric.files)
  })
})
