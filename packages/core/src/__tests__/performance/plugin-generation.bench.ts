import path from 'node:path'
import { bench, describe } from 'vitest'
import { build } from '../../build.ts'
import type { Config } from '../../types.ts'
import { AsyncEventEmitter } from '../../utils/AsyncEventEmitter.ts'

/**
 * Performance benchmarks for Kubb plugin generation
 * 
 * These benchmarks test the performance of generating code from OpenAPI specifications
 * using different plugin configurations. They help track performance regressions and
 * identify optimization opportunities.
 */

describe('Plugin Generation Performance', () => {
  const petStorePath = path.resolve(__dirname, '../../../mocks/petStore.yaml')

  bench(
    'single plugin generation (plugin-ts)',
    async () => {
      // Use dynamic import to avoid circular dependencies in tests
      const { pluginOas } = await import('@kubb/plugin-oas')
      const { pluginTs } = await import('@kubb/plugin-ts')

      const config: Config = {
        root: '.',
        input: {
          path: petStorePath,
        },
        output: {
          path: './src/gen',
          clean: false,
          write: false,
        },
        plugins: [
          pluginOas({ validate: false }),
          pluginTs({
            output: {
              path: 'types',
              barrelType: false,
            },
            enumType: 'asConst',
          }),
        ],
      }

      const events = new AsyncEventEmitter()
      await build({ config, events })
    },
    {
      iterations: 5,
    },
  )

  bench(
    'multiple plugins generation (plugin-ts + plugin-client)',
    async () => {
      const { pluginOas } = await import('@kubb/plugin-oas')
      const { pluginTs } = await import('@kubb/plugin-ts')
      const { pluginClient } = await import('@kubb/plugin-client')

      const config: Config = {
        root: '.',
        input: {
          path: petStorePath,
        },
        output: {
          path: './src/gen',
          clean: false,
          write: false,
        },
        plugins: [
          pluginOas({ validate: false }),
          pluginTs({
            output: {
              path: 'types',
              barrelType: false,
            },
            enumType: 'asConst',
          }),
          pluginClient({
            output: {
              path: 'clients',
            },
          }),
        ],
      }

      const events = new AsyncEventEmitter()
      await build({ config, events })
    },
    {
      iterations: 5,
    },
  )

  bench(
    'comprehensive plugin suite generation',
    async () => {
      const { pluginOas } = await import('@kubb/plugin-oas')
      const { pluginTs } = await import('@kubb/plugin-ts')
      const { pluginClient } = await import('@kubb/plugin-client')
      const { pluginZod } = await import('@kubb/plugin-zod')
      const { pluginFaker } = await import('@kubb/plugin-faker')

      const config: Config = {
        root: '.',
        input: {
          path: petStorePath,
        },
        output: {
          path: './src/gen',
          clean: false,
          write: false,
        },
        plugins: [
          pluginOas({ validate: false }),
          pluginTs({
            output: {
              path: 'types',
              barrelType: false,
            },
            enumType: 'asConst',
          }),
          pluginClient({
            output: {
              path: 'clients',
            },
          }),
          pluginZod({
            output: {
              path: 'zod',
              barrelType: false,
            },
            inferred: true,
          }),
          pluginFaker({
            output: {
              path: 'mocks',
              barrelType: false,
            },
          }),
        ],
      }

      const events = new AsyncEventEmitter()
      await build({ config, events })
    },
    {
      iterations: 3,
    },
  )
})
