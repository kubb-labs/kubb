import { mockedPluginManager } from '@kubb/core/mocks'
import { OasManager } from '@kubb/swagger'

import { Query } from './components/Query.tsx'
import { QueryKey } from './components/QueryKey.tsx'
import { QueryOptions } from './components/QueryOptions.tsx'
import { OperationGenerator } from './OperationGenerator.tsx'

import type { Plugin } from '@kubb/core'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import type { PluginOptions } from './types.ts'

describe('OperationGenerator', async () => {
  const oas = await OasManager.parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/swagger-client/mocks/petStore.yaml' },
  })

  test('[GET] should generate with pathParamsType `inline`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      framework: 'react',
      infinite: undefined,
      suspense: undefined,
      dataReturnType: 'data',
      pathParamsType: 'inline',
      templates: {
        query: Query.templates,
        queryKey: QueryKey.templates,
        queryOptions: QueryOptions.templates,
      },
      client: {
        importPath: '@kubb/swagger-client/client',
      },
      parser: undefined,
      query: {},
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: mockedPluginManager,
        plugin: { options } as Plugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = await og.get(operation, og.getSchemas(operation), options)

    expect(files).toMatchSnapshot()
  })

  test.only('[GET] should generate with pathParamsType `object`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      framework: 'react',
      infinite: undefined,
      suspense: undefined,
      dataReturnType: 'data',
      pathParamsType: 'object',
      templates: {
        query: Query.templates,
        queryKey: QueryKey.templates,
        queryOptions: QueryOptions.templates,
      },
      client: {
        importPath: '@kubb/swagger-client/client',
      },
      parser: undefined,
      query: {},
    }

    const og = await new OperationGenerator(
      options,
      {
        oas,
        exclude: [],
        include: undefined,
        pluginManager: mockedPluginManager,
        plugin: { options } as Plugin<PluginOptions>,
        contentType: undefined,
        override: undefined,
      },
    )
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = await og.get(operation, og.getSchemas(operation), options)

    expect(files).toMatchSnapshot()
  })
})
