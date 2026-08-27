import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mergeAdapter } from './resolveAdapter.ts'

beforeEach(() => {
  vi.resetModules()
})

describe('mergeAdapter', () => {
  it('returns the disk adapter unchanged when there are no studio options', async () => {
    const diskAdapter = { name: 'oas', options: { validate: true }, parse: vi.fn() } as any

    const result = await mergeAdapter(diskAdapter, undefined)

    expect(result).toBe(diskAdapter)
  })

  it('returns undefined when there is no disk adapter, even with studio options', async () => {
    const result = await mergeAdapter(undefined, { validate: false })

    expect(result).toBeUndefined()
  })

  it('re-invokes the same @kubb/adapter-<name> factory with merged options', async () => {
    const mockAdapterOas = vi.fn((options: unknown) => ({ name: 'oas', options, parse: vi.fn() }))
    vi.doMock('@kubb/adapter-oas', () => ({ adapterOas: mockAdapterOas }))
    const { mergeAdapter: merge } = await import('./resolveAdapter.ts')

    const diskAdapter = { name: 'oas', options: { validate: true, server: { index: 0 } }, parse: vi.fn() } as any

    const result = await merge(diskAdapter, { server: { index: 1 } })

    expect(mockAdapterOas).toHaveBeenCalledWith({ validate: true, server: { index: 1 } })
    expect(result).toStrictEqual({ name: 'oas', options: { validate: true, server: { index: 1 } }, parse: expect.any(Function) })
  })

  it('returns the disk adapter unchanged when the resolved package exports no callable factory', async () => {
    vi.doMock('@kubb/adapter-broken', () => ({ adapterBroken: 'not-a-function' }))
    const { mergeAdapter: merge } = await import('./resolveAdapter.ts')

    const diskAdapter = { name: 'broken', options: {}, parse: vi.fn() } as any

    const result = await merge(diskAdapter, { foo: 'bar' })

    expect(result).toBe(diskAdapter)
  })
})
