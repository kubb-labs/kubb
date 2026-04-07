/** biome-ignore-all lint/suspicious/noTemplateCurlyInString: for test case */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { OperationGenerator, renderOperation } from '@kubb/plugin-oas'
import { describe, test } from 'vitest'
import { createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import type { PluginMsw } from '../types.ts'
import { mswGenerator } from './mswGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('mswGenerator operation', async () => {
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
      name: 'getPetsTemplateBaseUrl',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'get',
      options: {
        baseURL: '${123456}',
      },
    },
    {
      name: 'getPetsFaker',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'get',
      options: {
        parser: 'faker',
      },
    },
    {
      name: 'createPet',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {},
    },
    {
      name: 'deletePet',
      input: '../../mocks/petStore.yaml',
      path: '/pets/{petId}',
      method: 'delete',
      options: {},
    },
    {
      name: 'createPetFaker',
      input: '../../mocks/petStore.yaml',
      path: '/pets',
      method: 'post',
      options: {
        parser: 'faker',
      },
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginMsw['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginMsw['resolvedOptions'] = {
      output: {
        path: '.',
      },
      parser: 'data',
      baseURL: undefined,
      group: undefined,
      exclude: [],
      include: undefined,
      override: [],
      ...props.options,
    }
    const plugin = createMockedPlugin<PluginMsw>({ name: 'plugin-msw', options })

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
      oas,
      mode: 'split',
      generator,
      Component: mswGenerator.Operation,
      plugin,
    })

    await matchFiles(mockedPluginDriver.fileManager.files, props.name)
  })
})
