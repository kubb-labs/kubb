import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config, Plugin } from '@kubb/core'
import { parse } from '@kubb/oas'
import { buildOperations, OperationGenerator } from '@kubb/plugin-oas'
import { createReactFabric } from '@kubb/react-fabric'
import { describe, test } from 'vitest'
import { createMockedPluginManager, matchFiles } from '#mocks'
import type { PluginOrpc } from '../types.ts'
import { baseGenerator } from './baseGenerator.tsx'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('baseGenerator operations', async () => {
  test('base', async () => {
    const oas = await parse(path.resolve(__dirname, '../../mocks/petStore.yaml'))

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
    }
    const plugin = { options } as Plugin<PluginOrpc>
    const fabric = createReactFabric()
    const mockedPluginManager = createMockedPluginManager('base')
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

    const operations = await generator.getOperations()

    await buildOperations(
      operations.map((item) => item.operation),
      {
        config: { root: '.', output: { path: 'test' } } as Config,
        fabric,
        generator,
        Component: baseGenerator.Operations,
        plugin,
      },
    )

    await matchFiles(fabric.files)
  })
})
