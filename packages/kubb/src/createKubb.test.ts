import type { UserConfig } from '@kubb/core'
import { createMockedPlugin } from '@kubb/core/mocks'
import { pluginBarrelName } from '@kubb/plugin-barrel'
import { describe, expect, test } from 'vitest'
import { createKubb } from './createKubb.ts'

describe('createKubb', () => {
  const plugin = createMockedPlugin({
    name: 'plugin',
    options: undefined as any,
  })

  test('returns a Kubb instance with the resolved config available right away', () => {
    const kubb = createKubb({
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
      plugins: [plugin],
    } as UserConfig)

    expect(kubb.config.root).toBe(process.cwd())
    expect(typeof kubb.build).toBe('function')
    expect(typeof kubb.safeBuild).toBe('function')
  })

  test('applies the same defaults as defineConfig', () => {
    const kubb = createKubb({
      input: { path: 'spec.yaml' },
      output: { path: './gen' },
      plugins: [plugin],
    } as UserConfig)

    expect(kubb.config.adapter).toBeDefined()
    expect(kubb.config.parsers.length).toBeGreaterThan(0)
    expect(kubb.config.plugins.some((p) => p.name === pluginBarrelName)).toBe(true)
    expect(kubb.config.output.barrel).toEqual({ type: 'named' })
  })

  test('shares the hooks emitter passed through options', () => {
    const kubb = createKubb(
      {
        input: { path: 'spec.yaml' },
        output: { path: './gen' },
        plugins: [plugin],
      } as UserConfig,
      {},
    )

    expect(kubb.hooks).toBeDefined()
  })
})
