import { createMockedPluginManager, matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { OperationGenerator } from '@kubb/plugin-oas'
import type { PluginMsw } from '../types.ts'
import { mswGenerator } from './mswGenerator.tsx'

describe('mswGenerator operation', async () => {
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
      name: 'getPetsFaker',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'get',
      options: {
        parser: 'faker',
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
    options: Partial<PluginMsw['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginMsw['resolvedOptions'] = {
      output: {
        path: '.',
      },
      parser: 'data',
      group: undefined,
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginMsw>
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
    await instance.build(mswGenerator)

    const operation = oas.operation(props.path, props.method)
    const files = await mswGenerator.operation?.({
      operation,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
