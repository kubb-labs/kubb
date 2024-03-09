import { mockedPluginManager } from '@kubb/core/mocks'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createRootServer } from '@kubb/react/server'
import { OasManager } from '@kubb/swagger'

import { OperationGenerator } from '../OperationGenerator.tsx'
import { Query } from './Query.tsx'
import { QueryKey } from './QueryKey.tsx'
import { QueryOptions } from './QueryOptions.tsx'

import type { Plugin } from '@kubb/core'
import type { ResolveNameParams } from '@kubb/core'
import type { AppContextProps } from '@kubb/react'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import type { PluginOptions } from '../types.ts'
import { Oas } from '@kubb/swagger/components'

describe('<Query/>', async () => {
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

  const options: GetOperationGeneratorOptions<OperationGenerator> = {
    framework: 'react',
    infinite: undefined,
    suspense: undefined,
    dataReturnType: 'data',
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

  const plugin = { options } as Plugin<PluginOptions>
  const og = await new OperationGenerator(
    options,
    {
      oas,
      exclude: [],
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
    },
  )

  test('showPetById', async () => {
    const operation = oas.operation('/pets/{petId}', 'get')
    const schemas = og.getSchemas(operation)
    const context: AppContextProps<PluginOptions['appMeta']> = { meta: { pluginManager: mockedPluginManager, plugin } }

    const Component = () => {
      return (
        <Oas oas={oas}>
          <Oas.Operation schemas={schemas} operation={operation}>
            <Query.File />
          </Oas.Operation>
        </Oas>
      )
    }
    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />, context)

    expect(output).toMatchFileSnapshot('./__snapshots__/Query/showPetById.ts')
  })
})
