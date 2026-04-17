import { definePlugin } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import type { Options } from './types.ts'

describe('Options', () => {
  test('accepts hook-style plugins in config', () => {
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {},
    }))()

    const options: Options = {
      config: {
        input: { path: './openapi.yaml' },
        output: { path: './src/gen' },
        plugins: [hookPlugin],
      },
    }

    expect(options.config?.plugins).toHaveLength(1)
  })
})
