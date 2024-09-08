import { createMockedPluginManager, matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { OperationGenerator } from '@kubb/plugin-oas'
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
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginZod>
    const instance = new OperationGenerator(options, {
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

    const operations = Object.values(instance.operationsByMethod).map((item) => Object.values(item).map((item) => item.operation))

    const files = await operationsGenerator.operations?.({
      operations: operations.flat().filter(Boolean),
      operationsByMethod: instance.operationsByMethod,
      options,
      instance,
    })

    console.log(instance.operationsByMethod)

    await matchFiles(files)
  })
})
