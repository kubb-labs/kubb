/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config, Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { buildOperation, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedPluginManager, matchFiles } from '#mocks'
import type { PluginCypress } from '../types.ts'
import { cypressGenerator } from './cypressGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('cypressGenerator operation', async () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const testData = [
    {
      name: 'showPetById',
      input: '../../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'get',
      options: {},
    },
    {
      name: 'getPets',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'get',
      options: {},
    },
    {
      name: 'getPetsWithTemplateString',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'get',
      options: {
        baseURL: '${123456}',
      },
    },
    {
      name: 'createPet',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {},
    },
    {
      name: 'updatePet',
      input: '../../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'put',
      options: {},
    },
    {
      name: 'deletePet',
      input: '../../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'delete',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginCypress['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginCypress['resolvedOptions'] = {
      output: {
        path: '.',
      },
      baseURL: undefined,
      group: undefined,
      dataReturnType: 'data',
      paramsCasing: 'camelcase',
      paramsType: 'inline',
      pathParamsType: 'inline',
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginCypress>

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

    const operation = oas.operation(props.path, props.method)

    await buildOperation(operation, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      generator,
      Component: cypressGenerator.Operation,
      plugin,
    })

    await matchFiles(fabric.files)
  })
})
