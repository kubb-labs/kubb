import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { OperationGenerator, renderOperation } from '@kubb/plugin-oas'
import { describe, test } from 'vitest'
import { createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { MutationKey, QueryKey } from '../components'
import type { PluginVueQuery } from '../types.ts'
import { infiniteQueryGenerator } from './infiniteQueryGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('infiniteQueryGenerator operation', async () => {

  const testData = [
    {
      name: 'findInfiniteByTags',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        infinite: {
          queryParam: 'pageSize',
          initialPageParam: 0,
          cursorParam: undefined,
        },
      },
    },
    {
      name: 'findInfiniteByTagsCursor',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByTags',
      method: 'get',
      options: {
        infinite: {
          queryParam: 'pageSize',
          initialPageParam: 0,
          cursorParam: 'cursor',
        },
      },
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginVueQuery['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginVueQuery['resolvedOptions'] = {
      client: {
        dataReturnType: 'data',
        client: 'axios',
        importPath: undefined,
        bundle: false,
      },
      parser: 'zod',
      paramsType: 'inline',
      paramsCasing: undefined,
      pathParamsType: 'inline',
      queryKey: QueryKey.getTransformer,
      mutationKey: MutationKey.getTransformer,
      query: {
        importPath: '@tanstack/react-query',
        methods: ['get'],
      },
      mutation: {
        methods: ['post'],
        importPath: '@tanstack/react-query',
      },
      output: {
        path: '.',
      },
      group: undefined,
      exclude: [],
      include: undefined,
      override: [],
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginVueQuery>({ name: 'plugin-vue-query', options })

    const mockedPluginDriver = createMockedPluginDriver({ name: props.name })
    const generator = new OperationGenerator(options, {
      oas,
      include: undefined,
      driver: mockedPluginDriver,

      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })

    const operation = oas.operation(props.path, props.method)
    await renderOperation(operation, {
      config: { root: '.', output: { path: 'test' } } as Config,
      driver: mockedPluginDriver,
      generator,
      Component: infiniteQueryGenerator.Operation,
      plugin,
    })

    await matchFiles(mockedPluginDriver.fileManager.files, props.name)
  })
})
