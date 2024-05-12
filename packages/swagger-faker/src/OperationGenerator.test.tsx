import {  mockedPluginManager } from '@kubb/core/mocks'

import { OperationGenerator } from './OperationGenerator.tsx'

import path from 'node:path';
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas';
import { parse } from '@kubb/oas/parser';
import type { GetOperationGeneratorOptions } from '@kubb/plugin-oas'
import { Oas } from '@kubb/plugin-oas/components';
import { App } from '@kubb/react';
import { createRootServer } from '@kubb/react/server';
import { OperationSchema } from './components';
import type { PluginFaker } from './types.ts'

describe('OperationGenerator', async () => {
  const oas = await parse(path.resolve(__dirname, '../mocks/petStore.yaml'))
  const testData = [
    {
      name: 'showPetById',
      path: '/pets/{petId}',
      method: 'get',
      options:{}
    },
    {
      name: 'getPets',
      path: '/pets',
      method: 'get',
      options:{}
    },  {
      name: 'createPet',
      path: '/pets',
      method: 'post',
      options:{
      }
    },
    {
      name: 'createPet with unknownType any',
      path: '/pets',
      method: 'post',
      options:{
        unknownType: "any"
      }
    },
    {
      name: 'deletePet',
      path: '/pets/{petId}',
      method: 'delete',
      options:{}
    },
    {
      name: 'createPet with seed 222',
      path: '/pets',
      method: 'post',
      options:{
        seed: [222],
      }
    },

  ] as const satisfies Array<{ name: string; path: string; method: HttpMethod; options: Partial<GetOperationGeneratorOptions<OperationGenerator>> }>

  test.each(testData)('$name', async ({ name, path, method, options: extraOptions }) => {
    const options: GetOperationGeneratorOptions<OperationGenerator> = {
      dateType: 'date',
      seed: undefined,
      transformers: {},
      unknownType: 'any',
      mapper: {},
      override: [],
      ...extraOptions
    }
    const plugin = { options } as Plugin<PluginFaker>
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
    const operation = oas.operation(path, method)

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
