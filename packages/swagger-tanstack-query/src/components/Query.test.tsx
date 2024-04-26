import { mockedPluginManager } from '@kubb/core/mocks'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createRootServer } from '@kubb/react/server'
import { Oas } from '@kubb/swagger/components'

import { OperationGenerator } from '../OperationGenerator.tsx'
import { Query } from './Query.tsx'
import { QueryKey } from './QueryKey.tsx'
import { QueryOptions } from './QueryOptions.tsx'

import type { Plugin } from '@kubb/core'
import type { ResolveNameParams } from '@kubb/core'
import { App } from '@kubb/react'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import { parseFromConfig } from '@kubb/swagger/utils'
import type { PluginOptions } from '../types.ts'

describe('<Query/>', async () => {
  const oas = await parseFromConfig({
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
    infinite: false,
    suspense: false,
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
    query: {
      methods: ['get'],
      queryKey: (key: unknown[]) => key,
    },
    queryOptions: {
      methods: ['get'],
    },
    mutate: false,
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
    mode: 'split',
  })

  test('showPetById', async () => {
    const operation = oas.operation('/pets/{uuid}', 'get')

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas oas={oas} operations={[operation]} getOperationSchemas={(...props) => og.getSchemas(...props)}>
            <Oas.Operation operation={operation}>
              <Query.File />
            </Oas.Operation>
          </Oas>
        </App>
      )
    }
    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />)

    expect(output).toMatchFileSnapshot('./__snapshots__/gen/showPetById.ts')
  })
})
