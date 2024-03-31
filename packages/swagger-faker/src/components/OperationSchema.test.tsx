import { mockedPluginManager } from '@kubb/core/mocks'
import { camelCase, pascalCase } from '@kubb/core/transformers'
import { createRootServer } from '@kubb/react/server'
import { OasManager } from '@kubb/swagger'
import { Oas } from '@kubb/swagger/components'

import { OperationGenerator } from '../OperationGenerator.tsx'
import { OperationSchema } from './OperationSchema.tsx'

import type { Plugin, ResolveNameParams } from '@kubb/core'
import type { AppContextProps } from '@kubb/react'
import type { GetOperationGeneratorOptions } from '@kubb/swagger'
import { fakerKeywordMapper } from '../fakerParser.tsx'
import type { PluginOptions } from '../types.ts'

describe('<OperationSchema/>', async () => {
  const oas = await OasManager.parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/swagger-faker/mocks/petStore.yaml' },
  })
  mockedPluginManager.resolveName = ({ type, name }: ResolveNameParams) => {
    if (type === 'file' || type === 'function') {
      return camelCase(`create ${name}`)
    }

    if (type === 'type') {
      return pascalCase(name)
    }
    return name
  }

  const options: GetOperationGeneratorOptions<OperationGenerator> = {
    dateType: 'date',
    seed: undefined,
    transformers: {},
    unknownType: 'any',
    mapper: fakerKeywordMapper,
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

  test('showPetById', async () => {
    const operation = oas.operation('/pets/{petId}', 'get')
    const context: AppContextProps<PluginOptions['appMeta']> = {
      meta: { pluginManager: mockedPluginManager, plugin },
    }

    const Component = () => {
      return (
        <Oas oas={oas} operations={[operation]} getOperationSchemas={(...props) => og.getSchemas(...props)}>
          <Oas.Operation operation={operation}>
            <OperationSchema.File mode="directory" />
          </Oas.Operation>
        </Oas>
      )
    }
    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />, context)

    expect(output).toMatchFileSnapshot('./__snapshots__/schema/showPetById.ts')
  })

  test('pets', async () => {
    const operation = oas.operation('/pets', 'post')
    const context: AppContextProps<PluginOptions['appMeta']> = {
      meta: { pluginManager: mockedPluginManager, plugin },
    }

    const Component = () => {
      return (
        <Oas oas={oas} operations={[operation]} getOperationSchemas={(...props) => og.getSchemas(...props)}>
          <Oas.Operation operation={operation}>
            <OperationSchema.File mode="directory" />
          </Oas.Operation>
        </Oas>
      )
    }
    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />, context)

    expect(output).toMatchFileSnapshot('./__snapshots__/schema/Pets.ts')
  })
})
