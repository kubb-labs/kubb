import { createMockedPluginManager, matchFiles, mockedPluginManager } from '@kubb/core/mocks'
import { parse } from '@kubb/oas'
import { OperationGenerator } from '@kubb/plugin-oas'
import { PluginManager } from '@kubb/core'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { createReactFabric } from '@kubb/react-fabric'
import type { Plugin } from '@kubb/core'
import { classClientGenerator } from './classClientGenerator.tsx'
import type { PluginClient } from '../types.ts'

describe('classClientGenerator', async () => {
  const oas = await parse(path.resolve(__dirname, '../../mocks/petStore.yaml'))

  const testData = [
    {
      name: 'findByTags',
      input: '../../mocks/petStore.yaml',
      options: {
        group: {
          type: 'tag' as const,
        },
      } as Partial<PluginClient['resolvedOptions']>,
    },
  ] as const satisfies Array<{
    input: string
    name: string
    options: Partial<PluginClient['resolvedOptions']>
  }>

  test.each(testData)('$name', async (props) => {
    const oas = await parse(path.resolve(__dirname, props.input))

    const options: PluginClient['resolvedOptions'] = {
      dataReturnType: 'data',
      paramsType: 'inline',
      paramsCasing: undefined,
      pathParamsType: 'inline',
      client: 'axios',
      clientType: 'class',
      importPath: undefined,
      bundle: false,
      baseURL: '',
      parser: 'client',
      output: {
        path: '.',
      },
      group: undefined,
      urlType: 'export',
      ...props.options,
    }
    const plugin = { options } as Plugin<PluginClient>
    const fabric = createReactFabric()
    const generator = new OperationGenerator(options, {
      fabric,
      oas,
      include: undefined,
      pluginManager: createMockedPluginManager(props.name),
      plugin,
      contentType: undefined,
      exclude: undefined,
      override: undefined,
      mode: 'split',
    })

    const results = await generator.build(classClientGenerator)

    await matchFiles(results)
  })
})
