import { defineConfig, definePlugin } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { getConfigs } from './getConfigs.ts'
import type { CosmiconfigResult } from './getCosmiConfig.ts'

const _plugin = definePlugin(() => {
  return {
    name: 'test',
  } as any
})

describe('getConfigs', () => {
  it('should return Config when config is set with defineConfig', async () => {
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
    const kubbUserConfig = await getConfigs(
      {
        config,
        filepath: './',
        isEmpty: false,
      },
      {} as any,
    )

    expect(kubbUserConfig).toEqual([
      {
        input: {
          path: './',
        },
        output: {
          path: './dist',
        },
        plugins: [],
      },
    ])
  })

  it('should return Config[] when config is set with defineConfig', async () => {
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
    const loadedConfig = await getConfigs(
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

  it('should return object when config is set with defineConfig and returns a promise', async () => {
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
    const kubbUserConfig = await getConfigs(
      {
        config,
        filepath: './',
        isEmpty: false,
      },
      {} as any,
    )

    expect(kubbUserConfig).toEqual([
      {
        input: {
          path: './',
        },
        output: {
          path: './dist',
        },
        plugins: [],
      },
    ])
  })
})
