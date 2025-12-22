import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { bench, describe } from 'vitest'
import type { Config } from '@kubb/core'
import { AsyncEventEmitter } from '@kubb/core/utils'

/**
 * Performance benchmarks for Kubb plugin generation
 * 
 * These benchmarks test the performance of generating code from OpenAPI specifications
 * using different plugin configurations. They help track performance regressions and
 * identify optimization opportunities.
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Plugin Generation Performance', () => {
  const petStorePath = path.resolve(__dirname, '../../../schemas/petStore.yaml')

  bench(
    'single plugin generation (plugin-ts)',
    async () => {
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
      time: 10000,
    },
  )

  bench(
    'multiple plugins generation (plugin-ts + plugin-client)',
    async () => {
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
      time: 10000,
    },
  )

  bench(
    'comprehensive plugin suite generation',
    async () => {
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
      time: 10000,
    },
  )
})
