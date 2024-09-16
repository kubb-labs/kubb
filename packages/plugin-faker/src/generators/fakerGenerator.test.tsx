import { createMockedPluginManager, matchFiles, mockedPluginManager } from '@kubb/core/mocks'

import path from 'node:path'
import type { Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas/parser'
import { OperationGenerator, SchemaGenerator } from '@kubb/plugin-oas'
import { getSchemas } from '@kubb/plugin-oas/utils'
import type { PluginFaker } from '../types.ts'
import { fakerGenerator } from './fakerGenerator.tsx'

describe('fakerGenerator schema', async () => {
  const testData = [
    {
      name: 'Pet',
      path: 'Pet',
      input: '../../mocks/petStore.yaml',
      options: {},
    },
    {
      name: 'PetWithDayjs',
      input: '../../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        dateType: 'string',
        dateParser: 'dayjs',
      },
    },
    {
      name: 'PetWithDateString',
      input: '../../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        dateParser: 'faker',
        dateType: 'string',
      },
    },
    {
      name: 'PetWithMapper',
      input: '../../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        mapper: {
          id: `faker.string.fromCharacters('abc')`,
          name: `faker.string.alpha({casing: 'lower'})`,
        },
      },
    },
    {
      name: 'PetWithRandExp',
      input: '../../mocks/petStore.yaml',
      path: 'Pet',
      options: {
        regexGenerator: 'randexp',
      },
    },
    {
      name: 'enumVarNames',
      input: '../../mocks/enums.yaml',
      path: 'enumVarNames.Type',
      options: {},
    },
    {
      name: 'enumNames',
      input: '../../mocks/enums.yaml',
      path: 'enumNames.Type',
      options: {},
    },
    {
      name: 'Pets',
      path: 'Pets',
      input: '../../mocks/petStore.yaml',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    options: Partial<PluginFaker['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginFaker['resolvedOptions'] = {
      dateType: 'date',
      dateParser: 'faker',
      seed: undefined,
      regexGenerator: 'faker',
      override: [],
      transformers: {},
      unknownType: 'unknown',
      mapper: {},
      output: {
        path: '.',
      },
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginFaker>
    const instance = new SchemaGenerator(options, {
      oas,
      pluginManager: createMockedPluginManager(props.name),
      plugin,
      contentType: 'application/json',
      include: undefined,
      override: undefined,
      mode: 'split',
      output: './gen',
    })
    await instance.build(fakerGenerator)

    const schemas = getSchemas({ oas })
    const name = props.path
    const schema = schemas[name]!
    const tree = instance.parse({ schema, name })

    const files = await fakerGenerator.schema?.({
      schema: {
        name,
        tree,
        value: schema,
      },
      options,
      instance,
    })

    await matchFiles(files)
  })
})

describe('fakerGenerator operation', async () => {
  const testData = [
    {
      name: 'showPetById',
      input: '../../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'get',
      options: {},
    },
    {
      name: 'getPets',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'get',
      options: {},
    },
    {
      name: 'createPet',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {},
    },
    {
      name: 'createPetUnknownTypeAny',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {
        unknownType: 'any',
      },
    },
    {
      name: 'createPetSeed',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {
        seed: [222],
      },
    },
    {
      name: 'deletePet',
      input: '../../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'delete',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginFaker['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginFaker['resolvedOptions'] = {
      dateType: 'date',
      dateParser: 'faker',
      seed: undefined,
      regexGenerator: 'faker',
      override: [],
      transformers: {},
      unknownType: 'unknown',
      mapper: {},
      output: {
        path: '.',
      },
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginFaker>
    const instance = new OperationGenerator(options, {
      oas,
      include: undefined,
      pluginManager: createMockedPluginManager(props.name),
      plugin,
      contentType: undefined,
      override: undefined,
      mode: 'split',
      exclude: [],
    })
    const operation = oas.operation(props.path, props.method)
    const files = await fakerGenerator.operation?.({
      operation,
      options,
      instance,
    })

    await matchFiles(files)
  })
})
