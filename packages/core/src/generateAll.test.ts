import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it } from 'vitest'
import { generateAll } from './generateAll.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import type { UserConfig } from './types.ts'

describe('generateAll', () => {
  it('generates the configs after one that fails, and marks only that one failed', async () => {
    const config = (parse?: () => Promise<never>) =>
      ({
        root: '/project',
        input: './spec.json',
        output: { path: './gen' },
        adapter: createMockedAdapter({ parse }),
        storage: memoryStorage(),
      }) satisfies UserConfig
    const broken = config(async () => {
      throw new Error('Cannot read the spec')
    })

    const results = await generateAll([broken, config()])

    expect(results.map((result) => result.success)).toStrictEqual([false, true])
  })
})
