import type { Config } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it, vi } from 'vitest'
import { resolveGenerateConfig } from './generate.ts'

describe('resolveGenerateConfig', () => {
  it('keeps the existing config when no adapter flag is provided', async () => {
    const adapter = createMockedAdapter({ name: 'custom' })
    const config: Config = {
      adapter,
      output: { path: './gen' },
      parsers: [],
      plugins: [],
      root: '.',
    }

    await expect(resolveGenerateConfig(config, undefined)).resolves.toBe(config)
  })

  it('overrides the config adapter when the CLI adapter flag is set', async () => {
    const config: Config = {
      adapter: createMockedAdapter({ name: 'custom' }),
      output: { path: './gen' },
      parsers: [],
      plugins: [],
      root: '.',
    }
    const adapter = createMockedAdapter({ name: 'oas' })
    const loadGenerateAdapter = vi.fn(async () => adapter)

    const resolved = await resolveGenerateConfig(config, 'oas', { loadGenerateAdapter })

    expect(loadGenerateAdapter).toHaveBeenCalledWith('oas')
    expect(resolved.adapter).toBe(adapter)
  })
})
