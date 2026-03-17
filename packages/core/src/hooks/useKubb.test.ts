import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMockedPluginManager } from '../../../../configs/mocks.ts'
import type { Plugin } from '../types.ts'

const mockedPluginManager = createMockedPluginManager('')

const mockedPlugin = { options: {} } as Plugin

vi.mock('@kubb/react-fabric', () => ({
  useApp: vi.fn(),
}))

import { useApp } from '@kubb/react-fabric'
import { useKubb } from './useKubb.ts'

describe('useKubb', () => {
  beforeEach(() => {
    vi.mocked(useApp).mockReturnValue({
      exit: vi.fn(),
      meta: {
        plugin: mockedPlugin,
        mode: 'split',
        pluginManager: mockedPluginManager,
      },
    })
  })

  test('returns plugin from context meta', () => {
    const { plugin } = useKubb()
    expect(plugin).toBe(mockedPlugin)
  })

  test('returns mode from context meta', () => {
    const { mode } = useKubb()
    expect(mode).toBe('split')
  })

  test('returns config from pluginManager', () => {
    const { config } = useKubb()
    expect(config).toBe(mockedPluginManager.config)
  })

  test('exposes bound pluginManager methods as top-level', () => {
    const result = useKubb()
    expect(typeof result.resolveName).toBe('function')
    expect(typeof result.resolvePath).toBe('function')
    expect(typeof result.getFile).toBe('function')
    expect(typeof result.getPluginByName).toBe('function')
  })

  test('respects mode set to single', () => {
    vi.mocked(useApp).mockReturnValue({
      exit: vi.fn(),
      meta: {
        plugin: mockedPlugin,
        mode: 'single',
        pluginManager: mockedPluginManager,
      },
    })
    const { mode } = useKubb()
    expect(mode).toBe('single')
  })
})
