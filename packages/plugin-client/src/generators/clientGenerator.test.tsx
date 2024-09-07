import { createMockedPluginManager, matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { OperationGenerator } from '@kubb/plugin-oas'
import { Client } from '../components/Client.tsx'
import type { PluginClient } from '../types.ts'
import { clientGenerator } from './clientGenerator.tsx'

describe('clientGenerator operation', async () => {
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
      name: 'getPetsFull',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'get',
      options: {
        dataReturnType: 'full',
      },
    },
    // {
    //   name: 'getPetsFullPathObject',
    //   input: '../../mocks/petStore.yaml',
    //   path: '/pets',
    //   method: 'get',
    //   options: {
    //     pathParamsType: "object"
    //   },
    // },
    {
      name: 'createPet',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginClient['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginClient['resolvedOptions'] = {
      dataReturnType: 'data',
      pathParamsType: 'inline',
      importPath: '@kubb/plugin-client/client',
      baseURL: '',
      template: Client,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginClient>
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
    await instance.build(clientGenerator)

    const operation = oas.operation(props.path, props.method)
    const files = await clientGenerator.operation?.({
      operation,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
