import { matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { OperationGenerator } from '@kubb/plugin-oas'
import type { PluginSwr } from '../types.ts'
import { mutationGenerator } from './mutationGenerator.tsx'

describe('mutationGenerator operation', async () => {
  const testData = [
    {
      name: 'createPets',
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
    options: Partial<PluginSwr['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginSwr['resolvedOptions'] = {
      client: {
        dataReturnType: 'data',
        importPath: '@kubb/plugin-client/client',
      },
      parser: 'zod',
      query: {
        methods: ['get'],
      },
      mutation: {
        methods: ['post'],
      },
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginSwr>
    const instance = new OperationGenerator(options, {
      oas,
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })
    await instance.build(mutationGenerator)

    const operation = oas.operation(props.path, props.method)
    const files = await mutationGenerator.operation?.({
      operation,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
