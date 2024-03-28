import { mockedPluginManager } from '@kubb/core/mocks'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createRootServer } from '@kubb/react/server'
import { OasManager } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'

import { OperationGenerator } from '../OperationGenerator.tsx'
import { Mutation } from './Mutation.tsx'
import { Query } from './Query.tsx'
import { QueryKey } from './QueryKey.tsx'
import { QueryOptions } from './QueryOptions.tsx'

import type { Plugin, ResolveNameParams } from '@kubb/core'
import type { AppContextProps } from '@kubb/react'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import type { PluginOptions } from '../types.ts'

describe('<Mutation/>', async () => {
  const oas = await OasManager.parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/swagger-tanstack-query/mocks/petStore.yaml' },
  })
  mockedPluginManager.resolveName = ({ type, name }: ResolveNameParams) => {
    if (type === 'file' || type === 'function') {
      return camelCase(`use ${name}`)
    }

    if (type === 'type') {
      return pascalCase(name)
    }
    return name
  }

  test('pets with veriableType `hook`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      framework: 'react',
      infinite: false,
      suspense: false,
      dataReturnType: 'data',
      pathParamsType: 'inline',
      templates: {
        query: Query.templates,
        queryKey: QueryKey.templates,
        queryOptions: QueryOptions.templates,
        mutation: Mutation.templates,
      },
      client: {
        importPath: '@kubb/swagger-client/client',
      },
      parser: undefined,
      query: false,
      queryOptions: false,
      mutate: { variablesType: 'hook', methods: ['post'] },
    }

    const plugin = { options } as Plugin<PluginOptions>
    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
    })

    const operation = oas.operation('/pets/{uuid}', 'post')
    const context: AppContextProps<PluginOptions['appMeta']> = {
      meta: { pluginManager: mockedPluginManager, plugin },
    }

    const Component = () => {
      return (
        <Oas oas={oas} operations={[operation]} getOperationSchemas={(...props) => og.getSchemas(...props)}>
          <Oas.Operation operation={operation}>
            <Mutation.File />
          </Oas.Operation>
        </Oas>
      )
    }
    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />, context)

    expect(output).toMatchFileSnapshot('./__snapshots__/gen/useCreatePets.ts')
  })

  test('pets with veriableType `mutate`', async () => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      framework: 'react',
      infinite: false,
      suspense: false,
      dataReturnType: 'data',
      pathParamsType: 'inline',
      templates: {
        query: Query.templates,
        queryKey: QueryKey.templates,
        queryOptions: QueryOptions.templates,
        mutation: Mutation.templates,
      },
      client: {
        importPath: '@kubb/swagger-client/client',
      },
      parser: undefined,
      query: false,
      queryOptions: false,
      mutate: { variablesType: 'mutate', methods: ['post'] },
    }

    const plugin = { options } as Plugin<PluginOptions>
    const og = await new OperationGenerator(options, {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
    })

    const operation = oas.operation('/pets/{uuid}', 'post')
    const context: AppContextProps<PluginOptions['appMeta']> = {
      meta: { pluginManager: mockedPluginManager, plugin },
    }

    const Component = () => {
      return (
        <Oas oas={oas} operations={[operation]} getOperationSchemas={(...props) => og.getSchemas(...props)}>
          <Oas.Operation operation={operation}>
            <Mutation.File />
          </Oas.Operation>
        </Oas>
      )
    }
    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />, context)

    expect(output).toMatchFileSnapshot('./__snapshots__/gen/useCreatePetsMutate.ts')
  })
})
