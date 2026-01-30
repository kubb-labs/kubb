import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config, Plugin } from '@kubb/core'
import type { HttpMethod } from '@kubb/oas'
import { parse } from '@kubb/oas'
import { buildOperation, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { describe, test } from 'vitest'
import { createMockedPluginManager, matchFiles } from '#mocks'
import type { PluginOrpc } from '../types.ts'
import { contractGenerator } from './contractGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('contractGenerator operation', async () => {
  const testData = [
    {
      name: 'getPetById',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'get',
      options: {},
    },
    {
      name: 'addPet',
      input: '../../mocks/petStore.yaml',
      path: '/pet',
      method: 'post',
      options: {},
    },
    {
      name: 'updatePet',
      input: '../../mocks/petStore.yaml',
      path: '/pet',
      method: 'put',
      options: {},
    },
    {
      name: 'deletePet',
      input: '../../mocks/petStore.yaml',
      path: '/pet/{petId}',
      method: 'delete',
      options: {},
    },
    {
      name: 'findPetsByStatus',
      input: '../../mocks/petStore.yaml',
      path: '/pet/findByStatus',
      method: 'get',
      options: {},
    },
    {
      name: 'logoutUser',
      input: '../../mocks/petStore.yaml',
      path: '/user/logout',
      method: 'get',
      options: {},
    },
  ] as const satisfies Array<{
    input: string
    name: string
    path: string
    method: HttpMethod
    options: Partial<PluginOrpc['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginOrpc['resolvedOptions'] = {
      output: {
        path: '.',
        banner: '/* eslint-disable no-alert, no-console */',
      },
      group: undefined,
      include: undefined,
      exclude: [],
      override: [],
      transformers: {},
      importPath: '@orpc/contract',
      zodImportPath: 'zod',
      router: false,
      routerName: 'router',
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginOrpc>
    const fabric = createReactFabric()
    const mockedPluginManager = createMockedPluginManager(props.name)
    const generator = new OperationGenerator(options, {
      fabric,
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

    await buildOperation(operation, {
      config: { root: '.', output: { path: 'test' } } as Config,
      fabric,
      generator,
      Component: contractGenerator.Operation,
      plugin,
    })

    await matchFiles(fabric.files)
  })
})
