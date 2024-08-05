import { mockedPluginManager } from '@kubb/core/mocks'
import { createRootServer } from '@kubb/react/server'

import { Oas } from '@kubb/plugin-oas/components'

import { OperationGenerator } from '../OperationGenerator.tsx'
import { OperationSchema } from './OperationSchema.tsx'

import type { Plugin } from '@kubb/core'
import { App } from '@kubb/react'
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'
import type { PluginTs } from '../types.ts'

describe('<OperationSchema/>', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/swagger-zod/mocks/petStore.yaml' },
  })

  const options: GetOperationGeneratorOptions<OperationGenerator> = {
    transformers: {},
    dateType: 'string',
    unknownType: 'any',
    enumSuffix: '',
    enumType: 'asConst',
    oasType: false,
    optionalType: 'undefined',
    usedEnumNames: {},
    override: [],
    mapper: {},
    extName: undefined
  }

  const plugin = { options } as Plugin<PluginTs>
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
    const operation = oas.operation('/pets/{petId}', 'get')

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas oas={oas} operations={[operation]} generator={og}>
            <Oas.Operation operation={operation}>
              <OperationSchema.File />
            </Oas.Operation>
          </Oas>
        </App>
      )
    }

    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />)

    expect(output).toMatchFileSnapshot('./__snapshots__/Schema/showPetById.ts')
  })

  test('pets', async () => {
    const operation = oas.operation('/pets', 'post')

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas oas={oas} operations={[operation]} generator={og}>
            <Oas.Operation operation={operation}>
              <OperationSchema.File />
            </Oas.Operation>
          </Oas>
        </App>
      )
    }

    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />)

    expect(output).toMatchFileSnapshot('./__snapshots__/Schema/pets.ts')
  })
})
