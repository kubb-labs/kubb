import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createMockedPluginDriver } from '../../../../configs/mocks.ts'
import type { Plugin } from '../types.ts'

const mockedPluginDriver = createMockedPluginDriver()

const mockedPlugin = { options: {} } as Plugin

vi.mock('@kubb/react-fabric', () => ({
  useFabric: vi.fn(),
}))

import { useFabric } from '@kubb/react-fabric'
import { useKubb } from './useKubb.ts'

describe('useKubb', () => {
  beforeEach(() => {
    vi.mocked(useFabric).mockReturnValue({
      exit: vi.fn(),
      meta: {
        plugin: mockedPlugin,
        mode: 'split',
        driver: mockedPluginDriver,
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

  test('returns config from pluginDriver', () => {
    const { config } = useKubb()

    expect(config).toBe(mockedPluginDriver.config)
  })

  test('exposes bound pluginDriver methods as top-level', () => {
    const result = useKubb()

    expect(typeof result.resolveName).toBe('function')
    expect(typeof result.resolvePath).toBe('function')
    expect(typeof result.getFile).toBe('function')
    expect(typeof result.getPluginByName).toBe('function')
  })

  test('respects mode set to single', () => {
    vi.mocked(useFabric).mockReturnValue({
      exit: vi.fn(),
      meta: {
        plugin: mockedPlugin,
        mode: 'single',
        driver: mockedPluginDriver,
      },
    })
    const { mode } = useKubb()

    expect(mode).toBe('single')
  })
})
