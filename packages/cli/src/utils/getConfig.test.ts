import { defineConfig } from '@kubb/core'
import createSwagger from '@kubb/swagger'

import { getConfig } from './getConfig.ts'

import type { CosmiconfigResult } from '../types.ts'

describe('getConfig', () => {
  test('return object when config is set with defineConfig', async () => {
    const config: CosmiconfigResult['config'] = defineConfig(() => {
      return {
        input: {
          path: './',
        },
        output: {
          path: './dist',
        },
        plugins: [],
      }
    })
    const kubbUserConfig = await getConfig(
      {
        config,
        filepath: './',
        isEmpty: false,
      },
      {},
    )

    expect(kubbUserConfig).toEqual({
      input: {
        path: './',
      },
      output: {
        path: './dist',
      },
      plugins: [],
    })
  })

  test('return object when config is set with defineConfig and returns a promise', async () => {
    const config: CosmiconfigResult['config'] = defineConfig(() => {
      return Promise.resolve({
        input: {
          path: './',
        },
        output: {
          path: './dist',
        },
        plugins: [],
      })
    })
    const kubbUserConfig = await getConfig(
      {
        config,
        filepath: './',
        isEmpty: false,
      },
      {},
    )

    expect(kubbUserConfig).toEqual({
      input: {
        path: './',
      },
      output: {
        path: './dist',
      },
      plugins: [],
    })
  })

  test('return object when config is set with defineConfig and plugins is an function', async () => {
    const config: CosmiconfigResult['config'] = defineConfig(() => {
      return {
        input: {
          path: './',
        },
        output: {
          path: './dist',
        },
        plugins: [createSwagger({})],
      }
    })
    const kubbUserConfig = await getConfig(
      {
        config,
        filepath: './',
        isEmpty: false,
      },
      {},
    )

    expect(kubbUserConfig.plugins?.[0]?.name).toEqual(createSwagger({}).name)
  })

  test('return object when config is set with defineConfig and plugins is an object', async () => {
    const config: CosmiconfigResult['config'] = defineConfig(() => {
      return {
        input: {
          path: './',
        },
        output: {
          path: './dist',
        },
        plugins: [['@kubb/swagger']] as any,
      }
    })
    const kubbUserConfig = await getConfig(
      {
        config,
        filepath: './',
        isEmpty: false,
      },
      {},
    )

    expect(kubbUserConfig.plugins?.[0]?.name).toEqual(createSwagger({}).name)
  })
})
