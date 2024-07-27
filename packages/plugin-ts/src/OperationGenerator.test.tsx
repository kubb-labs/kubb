import { mockedPluginManager } from '@kubb/core/mocks'

import { OperationGenerator } from './OperationGenerator.tsx'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components'
import { App } from '@kubb/react'
import { createRootServer } from '@kubb/react/server'
import { OperationSchema } from './components'
import type { PluginTs } from './types.ts'

describe('OperationGenerator', async () => {
  const testData = [
    {
      name: 'showPetById',
      input: '../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'get',
      options: {},
    },
    {
      name: 'getPets',
      input: '../mocks/petStore.yaml',
      path: '/pets',
      method: 'get',
      options: {},
    },
    {
      name: 'createPet',
      input: '../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {},
    },
    {
      name: 'createPet with unknownType unknown',
      input: '../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {
        unknownType: 'unknown',
      },
    },
    {
      name: 'deletePet',
      input: '../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'delete',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<GetOperationGeneratorOptions<OperationGenerator>>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      enumType: 'asConst',
      enumSuffix: '',
      dateType: 'string',
      optionalType: 'questionToken',
      usedEnumNames: {},
      transformers: {},
      oasType: false,
      unknownType: 'any',
      override: [],
      mapper: {},
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginTs>
    const generator = new OperationGenerator(options, {
      oas,
      include: undefined,
      pluginManager: mockedPluginManager,
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })
    const operation = oas.operation(props.path, props.method)

    const Component = () => {
      return (
        <App plugin={plugin} pluginManager={mockedPluginManager} mode="split">
          <Oas oas={oas} operations={[operation]} generator={generator}>
            <Oas.Operation operation={operation}>
              <OperationSchema.File />
            </Oas.Operation>
          </Oas>
        </App>
      )
    }
    const root = createRootServer({ logger: mockedPluginManager.logger })
    const output = await root.renderToString(<Component />)

    expect(output).toMatchSnapshot()
  })
})
