import { matchFiles, mockedPluginManager } from '@kubb/core/mocks'
import { createRootServer } from '@kubb/react/server'
import { Oas } from '@kubb/plugin-oas/components'


import type { Plugin } from '@kubb/core'
import { App } from '@kubb/react'
import {  OperationGenerator } from '@kubb/plugin-oas'
import { parseFromConfig } from '@kubb/plugin-oas/utils'
import type { PluginClient } from '../types.ts'
import { Client } from './Client.tsx';
import { axiosParser } from '../parsers/axiosParser.tsx';

describe('<Client/>', async () => {
  const oas = await parseFromConfig({
    root: './',
    output: { path: 'test', clean: true },
    input: { path: 'packages/plugin-client/mocks/petStore.yaml' },
  })

  const options: PluginClient["resolvedOptions"] = {
    dataReturnType: 'data',
    pathParamsType: 'object',
    templates: {
      client: Client,
    },
    client: {
      importPath: '@kubb/plugin-client/client',
    },
    baseURL: '',
    extName: undefined,
  }
  const plugin = { options } as Plugin<PluginClient>
  const og = new OperationGenerator<PluginClient>(options as any, {
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
    const operation = oas.operation('/pets/{pet_id}', 'get')
    const files = await axiosParser.operation?.({
      operation,
      options,
      instance: og
    })

    await matchFiles(files)

  })
})
