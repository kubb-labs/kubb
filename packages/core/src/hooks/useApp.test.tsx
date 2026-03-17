import { App, createReactFabric } from '@kubb/react-fabric'
import { describe, expect, test } from 'vitest'
import { createMockedPluginManager } from '../../../../configs/mocks.ts'
import type { Plugin } from '../types.ts'
import { useApp } from './useApp.ts'

const mockedPluginManager = createMockedPluginManager('')
const mockedPlugin = { options: {} } as Plugin

describe('useApp', () => {
  test('returns plugin, mode and pluginManager methods from context', async () => {
    const fabric = createReactFabric()
    let result: ReturnType<typeof useApp> | undefined

    function TestComponent() {
      result = useApp()
      return null
    }

    await fabric.render(
      <App meta={{ plugin: mockedPlugin, mode: 'split', pluginManager: mockedPluginManager }}>
        <TestComponent />
      </App>,
    )

    expect(result?.plugin).toBe(mockedPlugin)
    expect(result?.mode).toBe('split')
    expect(result?.config).toBe(mockedPluginManager.config)
    expect(typeof result?.resolveName).toBe('function')
    expect(typeof result?.resolvePath).toBe('function')
    expect(typeof result?.getFile).toBe('function')
    expect(typeof result?.getPluginByName).toBe('function')
  })

  test('returns correct mode when set to single', async () => {
    const fabric = createReactFabric()
    let mode: string | undefined

    function TestComponent() {
      mode = useApp().mode
      return null
    }

    await fabric.render(
      <App meta={{ plugin: mockedPlugin, mode: 'single', pluginManager: mockedPluginManager }}>
        <TestComponent />
      </App>,
    )

    expect(mode).toBe('single')
  })

  test('binds pluginManager methods to pluginManager instance', async () => {
    const fabric = createReactFabric()
    let result: ReturnType<typeof useApp> | undefined

    function TestComponent() {
      result = useApp()
      return null
    }

    await fabric.render(
      <App meta={{ plugin: mockedPlugin, mode: 'split', pluginManager: mockedPluginManager }}>
        <TestComponent />
      </App>,
    )

    expect(result?.resolvePath({ baseName: 'test.ts', pluginName: 'test', options: {} })).toBe('test.ts')
    expect(result?.getPluginByName('unknown')).toBeUndefined()
  })
})
