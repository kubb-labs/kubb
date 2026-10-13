import { runWithNuxtContext } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import { describe, expect, test } from 'vitest'
import nuxtModule from './nuxt.ts'

type Hook = (...args: Array<unknown>) => unknown

type BuildConfig = {
  name?: string
  plugins: Array<unknown>
}

/**
 * Builds the part of a Nuxt instance that `@nuxt/kit`'s plugin helpers use: build options and
 * hook registration. Tests call the registered hooks the way each Nuxt builder does.
 */
async function setupNuxt({ dev }: { dev: boolean }) {
  const hooks = new Map<string, Array<Hook>>()
  const nuxt = {
    options: { dev, build: true },
    hook(name: string, hook: Hook) {
      hooks.set(name, [...(hooks.get(name) ?? []), hook])
    },
  } as unknown as Nuxt

  await runWithNuxtContext(nuxt, () => nuxtModule({ config: { input: './petStore.yaml', output: { path: './gen' } } }, nuxt))

  return {
    hookNames: [...hooks.keys()],
    async callHook(name: string, ...args: Array<unknown>) {
      for (const hook of hooks.get(name) ?? []) {
        await hook(...args)
      }
    },
  }
}

describe('nuxt', () => {
  test('exposes the module meta', async () => {
    await expect(nuxtModule.getMeta?.()).resolves.toMatchObject({
      name: 'nuxt-unplugin-kubb',
      configKey: 'unpluginKubb',
    })
  })

  test('registers Kubb in the Vite client build only', async () => {
    const nuxt = await setupNuxt({ dev: false })
    const client: BuildConfig = { plugins: [] }
    const server: BuildConfig = { plugins: [] }

    await nuxt.callHook('vite:extend', { config: {} })
    await nuxt.callHook('vite:extendConfig', client, { isClient: true, isServer: false })
    await nuxt.callHook('vite:extendConfig', server, { isClient: false, isServer: true })

    expect(client.plugins).toMatchObject([{ name: 'unplugin-kubb' }])
    expect(server.plugins).toEqual([])
  })

  test.each(['webpack', 'rspack'])('registers Kubb in the %s client build only', async (builder) => {
    const nuxt = await setupNuxt({ dev: false })
    const client: BuildConfig = { name: 'client', plugins: [] }
    const server: BuildConfig = { name: 'server', plugins: [] }

    await nuxt.callHook(`${builder}:config`, [client, server])

    expect(client.plugins).toHaveLength(1)
    expect(server.plugins).toEqual([])
  })

  test('skips the development server', async () => {
    const nuxt = await setupNuxt({ dev: true })

    expect(nuxt.hookNames).toEqual([])
  })
})
