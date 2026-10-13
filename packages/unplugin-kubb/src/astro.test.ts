import { describe, expect, test } from 'vitest'
import astro from './astro.ts'

describe('astro', () => {
  test('adds the Kubb Vite plugin to the Astro config', async () => {
    const integration = astro({ config: { input: './petStore.yaml', output: { path: './gen' } } })
    const config: { vite: { plugins?: Array<unknown> } } = { vite: {} }

    await integration.hooks['astro:config:setup']({ config })

    expect(integration.name).toBe('unplugin-kubb')
    expect(config.vite.plugins).toMatchObject([{ name: 'unplugin-kubb' }])
  })
})
