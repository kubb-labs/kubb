import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import type { OperationNode } from '@kubb/ast/types'
import type { Config } from '@kubb/core'
import { renderOperations } from '@kubb/core'
import type { PluginTs } from '@kubb/plugin-ts'
import { resolverTs } from '@kubb/plugin-ts'
import type { PluginZod } from '@kubb/plugin-zod'
import { resolverZod } from '@kubb/plugin-zod'
import { createReactFabric } from '@kubb/react-fabric'
import { beforeEach, describe, test } from 'vitest'
import { createMockedAdapter, createMockedPlugin, createMockedPluginDriver, matchFiles } from '#mocks'
import { resolverMcp } from '../resolvers/resolverMcp.ts'
import type { PluginMcp } from '../types.ts'
import { serverGenerator } from './serverGenerator.tsx'

const testConfig: Config = { root: '.', input: { path: '' }, output: { path: 'test' }, plugins: [] }

const defaultOptions: PluginMcp['resolvedOptions'] = {
  output: { path: '.' },
  client: {
    client: 'axios',
    baseURL: '',
    dataReturnType: 'data',
  },
  paramsCasing: undefined,
  group: undefined,
  resolver: resolverMcp,
}

const mockedTsPlugin = createMockedPlugin<PluginTs>({
  name: 'plugin-ts',
  options: { output: { path: '.' }, group: undefined } as PluginTs['resolvedOptions'],
  resolver: resolverTs,
})

const mockedZodPlugin = createMockedPlugin<PluginZod>({
  name: 'plugin-zod',
  options: { output: { path: '.' }, group: undefined } as PluginZod['resolvedOptions'],
  resolver: resolverZod,
})

describe('serverGenerator — Operations', () => {
  const fabric = createReactFabric()

  beforeEach(() => {
    fabric.context.fileManager.clear()
  })

  const nodes: Array<OperationNode> = [
    createOperation({
      operationId: 'showPetById',
      method: 'GET',
      path: '/pets/{petId}',
      tags: ['pets'],
      parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'string' }), required: true })],
      responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'object', properties: [] }), description: 'Expected response' })],
    }),
  ]

  test('showPetById', async () => {
    const plugin = createMockedPlugin<PluginMcp>({ name: 'plugin-mcp', options: defaultOptions, resolver: resolverMcp })
    const driver = createMockedPluginDriver({ name: 'showPetById', plugin: mockedTsPlugin })
    // Also register zod plugin — serverGenerator needs it for zod schema imports
    const originalGetPlugin = driver.getPlugin.bind(driver)
    driver.getPlugin = (pluginName: string) => {
      if (pluginName === 'plugin-zod') return mockedZodPlugin as any
      return originalGetPlugin(pluginName)
    }

    await renderOperations(nodes, {
      config: testConfig,
      fabric,
      adapter: createMockedAdapter(),
      driver,
      Component: serverGenerator.Operations,
      plugin,
      options: defaultOptions,
      resolver: resolverMcp,
    })

    await matchFiles(fabric.files, 'showPetById')
  })
})
