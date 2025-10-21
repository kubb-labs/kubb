import { createPlugin, defineConfig } from '@kubb/core'

import { getConfig } from './getConfig.ts'

import type { CosmiconfigResult } from './getCosmiConfig.ts'

const plugin = createPlugin(() => {
  return {
    name: 'test',
  } as any
})

describe('getConfig', () => {
  test('return Config when config is set with defineConfig', async () => {
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
      {} as any,
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

  test('return Config[] when config is set with defineConfig', async () => {
    const config: CosmiconfigResult['config'] = defineConfig(() => {
      return [
        {
          name: '1',
          input: {
            path: './',
          },
          output: {
            path: './dist',
          },
          plugins: [],
        },
        {
          name: '2',
          input: {
            path: './',
          },
          output: {
            path: './dist2',
          },
          plugins: [],
        },
      ]
    })
    const loadedConfig = await getConfig(
      {
        config,
        filepath: './',
        isEmpty: false,
      },
      {} as any,
    )

    expect(Array.isArray(loadedConfig)).toBeTruthy()

    if (Array.isArray(loadedConfig)) {
      const [kubbUserConfig1, kubbUserConfig2] = loadedConfig

      expect(kubbUserConfig1).toEqual({
        name: '1',
        input: {
          path: './',
        },
        output: {
          path: './dist',
        },
        plugins: [],
      })
      expect(kubbUserConfig2).toEqual({
        name: '2',
        input: {
          path: './',
        },
        output: {
          path: './dist2',
        },
        plugins: [],
      })
    }
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
      {} as any,
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
        plugins: [plugin()],
      }
    })
    const kubbUserConfig = await getConfig(
      {
        config,
        filepath: './',
        isEmpty: false,
      },
      {} as any,
    )
    if (!Array.isArray(kubbUserConfig)) {
      expect(kubbUserConfig.plugins?.[0]?.name).toEqual(plugin().name)
    }
  })
})
