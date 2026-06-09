import { createFile, createSchema, createSource, createText } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it, type Mock, vi } from 'vitest'
import type { Cache, CachedSnapshot } from './createCache.ts'
import { createKubb } from './createKubb.ts'
import { definePlugin } from './definePlugin.ts'
import { memoryStorage } from './storages/memoryStorage.ts'
import type { Config, Plugin, Storage } from './types.ts'

function memoryCache(): Cache {
  const store = new Map<string, CachedSnapshot>()
  return {
    name: 'test',
    restore: vi.fn(async ({ key }: { key: string }) => store.get(key) ?? null),
    persist: vi.fn(async ({ key, snapshot }: { key: string; snapshot: CachedSnapshot }) => {
      store.set(key, snapshot)
    }),
  }
}

async function dump(storage: Storage): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  for (const key of await storage.getKeys()) {
    out[key] = (await storage.getItem(key)) ?? ''
  }
  return out
}

function makeConfig({ storage, cache, schemaSpy, fileCount = 1 }: { storage: Storage; cache: Cache; schemaSpy: Mock<() => void>; fileCount?: number }): Config {
  const plugin = definePlugin(() => ({
    name: 'plugin',
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.addGenerator({
          name: 'gen',
          schema() {
            schemaSpy()
            return Array.from({ length: fileCount }, (_, index) =>
              createFile({
                path: `/gen/pet${index}.ts`,
                baseName: `pet${index}.ts`,
                sources: [createSource({ nodes: [createText(`export type Pet${index} = { id: number }`)] })],
                imports: [],
                exports: [],
              }),
            )
          },
        })
      },
    },
  }))()

  return {
    root: '.',
    input: { data: { openapi: '3.1.0', paths: {} } },
    output: { path: '/gen' },
    parsers: [],
    reporters: [],
    adapter: createMockedAdapter({
      parse: async () => ({
        kind: 'Input' as const,
        meta: { circularNames: [], enumNames: [] },
        schemas: [createSchema({ name: 'Pet', type: 'string' })],
        operations: [],
      }),
    }),
    plugins: [plugin] as unknown as Array<Plugin>,
    storage,
    cache,
  } satisfies Config
}

describe('incremental build cache', () => {
  it('skips generation on a hot run and reproduces identical output', async () => {
    const cache = memoryCache()
    const schemaSpy = vi.fn<() => void>()

    const storage1 = memoryStorage()
    await createKubb(makeConfig({ storage: storage1, cache, schemaSpy })).build()

    expect(schemaSpy).toHaveBeenCalledTimes(1)
    expect(cache.persist).toHaveBeenCalledTimes(1)
    const cold = await dump(storage1)

    const storage2 = memoryStorage()
    await createKubb(makeConfig({ storage: storage2, cache, schemaSpy })).build()

    // The generator never ran on the second build — the snapshot was restored instead.
    expect(schemaSpy).toHaveBeenCalledTimes(1)
    expect(cache.restore).toHaveBeenCalled()
    expect(await dump(storage2)).toStrictEqual(cold)
  })

  it('persists the rendered sources in the snapshot', async () => {
    const cache = memoryCache()
    const schemaSpy = vi.fn<() => void>()

    await createKubb(makeConfig({ storage: memoryStorage(), cache, schemaSpy })).build()

    const persist = cache.persist as Mock
    const call = persist.mock.calls[0]?.[0] as { snapshot: CachedSnapshot } | undefined
    expect(call?.snapshot.files['pet0.ts']).toContain('export type Pet0 = { id: number }')
  })

  it('restores a snapshot larger than one write batch and skips generation', async () => {
    const cache = memoryCache()
    const schemaSpy = vi.fn<() => void>()
    const fileCount = 55

    const storage1 = memoryStorage()
    await createKubb(makeConfig({ storage: storage1, cache, schemaSpy, fileCount })).build()
    const cold = await dump(storage1)

    expect(Object.keys(cold)).toHaveLength(fileCount)

    const storage2 = memoryStorage()
    await createKubb(makeConfig({ storage: storage2, cache, schemaSpy, fileCount })).build()

    expect(schemaSpy).toHaveBeenCalledTimes(1)
    expect(await dump(storage2)).toStrictEqual(cold)
  })

  it('regenerates when the input changes (cache miss)', async () => {
    const cache = memoryCache()
    const schemaSpy = vi.fn<() => void>()

    await createKubb(makeConfig({ storage: memoryStorage(), cache, schemaSpy })).build()

    const changed = makeConfig({ storage: memoryStorage(), cache, schemaSpy })
    changed.input = { data: { openapi: '3.0.0', paths: {} } }
    await createKubb(changed).build()

    expect(schemaSpy).toHaveBeenCalledTimes(2)
  })

  it('does not persist a build that has errors', async () => {
    const cache = memoryCache()
    const plugin = definePlugin(() => ({
      name: 'boom',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({
            name: 'gen',
            schema() {
              throw new Error('generation failed')
            },
          })
        },
      },
    }))()

    const config = {
      root: '.',
      input: { data: { openapi: '3.1.0' } },
      output: { path: '/gen' },
      parsers: [],
      reporters: [],
      adapter: createMockedAdapter({
        parse: async () => ({
          kind: 'Input' as const,
          meta: { circularNames: [], enumNames: [] },
          schemas: [createSchema({ name: 'Pet', type: 'string' })],
          operations: [],
        }),
      }),
      plugins: [plugin] as unknown as Array<Plugin>,
      storage: memoryStorage(),
      cache,
    } satisfies Config

    await createKubb(config).safeBuild()

    expect(cache.persist).not.toHaveBeenCalled()
  })
})
