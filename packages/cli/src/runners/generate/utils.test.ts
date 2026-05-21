import process from 'node:process'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const searchMock = vi.fn()
const loadMock = vi.fn()

vi.mock('cosmiconfig', () => ({
  cosmiconfig: vi.fn(() => ({ search: searchMock, load: loadMock })),
}))

vi.mock('jiti', () => ({
  createJiti: vi.fn(() => ({ import: vi.fn() })),
}))

describe('getConfigs', () => {
  beforeEach(() => {
    vi.resetModules()
    searchMock.mockReset()
    loadMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults root to process.cwd() when the user config omits root', async () => {
    searchMock.mockResolvedValueOnce({
      filepath: '/fake/kubb.config.ts',
      config: { input: { path: 'spec.yaml' }, output: { path: './gen' } },
    })

    const { getConfigs } = await import('./utils.ts')
    const { configs } = await getConfigs({})

    expect(configs).toHaveLength(1)
    expect(configs[0]!.root).toBe(process.cwd())
    expect(configs[0]!.plugins).toEqual([])
  })

  it('preserves a user-provided root', async () => {
    searchMock.mockResolvedValueOnce({
      filepath: '/fake/kubb.config.ts',
      config: { root: '/custom/root', input: { path: 'spec.yaml' }, output: { path: './gen' } },
    })

    const { getConfigs } = await import('./utils.ts')
    const { configs } = await getConfigs({})

    expect(configs[0]!.root).toBe('/custom/root')
  })

  it('normalizes root for every config when an array is returned', async () => {
    searchMock.mockResolvedValueOnce({
      filepath: '/fake/kubb.config.ts',
      config: [
        { input: { path: 'a.yaml' }, output: { path: './a' } },
        { root: '/explicit', input: { path: 'b.yaml' }, output: { path: './b' } },
      ],
    })

    const { getConfigs } = await import('./utils.ts')
    const { configs } = await getConfigs({})

    expect(configs).toHaveLength(2)
    expect(configs[0]!.root).toBe(process.cwd())
    expect(configs[1]!.root).toBe('/explicit')
  })
})
