import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config, Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { buildOperations, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { describe, test } from 'vitest'
import { createMockedPluginManager, matchFiles } from '#mocks'
import type { PluginZod } from '../types.ts'
import { operationsGenerator } from './operationsGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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
      mini: false,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginZod>
    const fabric = createReactFabric()
    const mockedPluginManager = createMockedPluginManager({ name: props.name })
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

    await buildOperations(
      operations.map((item) => item.operation),
      {
        config: { root: '.', output: { path: 'test' } } as Config,
        fabric,
        generator,
        Component: operationsGenerator.Operations,
        plugin,
      },
    )

    await matchFiles(fabric.files)
  })
})
