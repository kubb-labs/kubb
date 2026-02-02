import { createFabric } from '@kubb/react-fabric'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { definePlugin } from './definePlugin.ts'
import { PluginManager } from './PluginManager.ts'
import { registerNameResolver, registerPathResolver } from './ResolverRegistry.ts'
import type { Config, KubbEvents, Plugin } from './types.ts'
import { AsyncEventEmitter } from './utils/AsyncEventEmitter.ts'

describe('PluginManager', () => {
  const pluginAMocks = {
    install: vi.fn(),
    resolvePath: vi.fn(),
  } as const
  const pluginBMocks = {
    install: vi.fn(),
    resolvePath: vi.fn(),
  } as const

  // Register resolvers for test plugins
  registerNameResolver('pluginA', (name) => `pluginA${name}`)
  registerNameResolver('pluginB', (name) => `pluginB${name}`)
  registerPathResolver('pluginA', (baseName, _mode, _options, ctx) => {
    pluginAMocks.resolvePath()
    return `${ctx.root}/pluginA/gen/${baseName}`
  })
  registerPathResolver('pluginB', (baseName, _mode, _options, ctx) => {
    pluginBMocks.resolvePath()
    return `${ctx.root}/pluginB/gen/${baseName}`
  })

  const pluginA = definePlugin(() => {
    return {
      name: 'pluginA',
      options: undefined as any,
      context: undefined as never,

      key: ['pluginA'],
      install() {
        pluginAMocks.install()
      },
    }
  })

  const pluginB = definePlugin(() => {
    return {
      name: 'pluginB',
      options: undefined as any,
      context: undefined as never,
      key: ['pluginB', 1],
      install() {
        pluginBMocks.install()
      },
    }
  })

  const pluginBBis = definePlugin(() => {
    return {
      name: 'pluginB',
      options: undefined as any,
      context: undefined as never,
      key: ['pluginB', 2],
      install() {
        pluginBMocks.install()
      },
    }
  })

  const config = {
    root: '.',
    input: {
      path: './petStore.yaml',
    },
    output: {
      path: './src/gen',
      clean: true,
    },
    plugins: [pluginA({}), pluginB({}), pluginBBis({})] as Plugin[],
  } satisfies Config
  const pluginManager = new PluginManager(config, {
    fabric: createFabric(),
    events: new AsyncEventEmitter<KubbEvents>(),
  })

  afterEach(() => {
    pluginBMocks.resolvePath.mockReset()
  })

  test('if pluginManager can be created', () => {
    expect(pluginManager.plugins.length).toBe(config.plugins.length)
    expect(pluginManager.getPluginsByKey('install', ['pluginB'])?.[0]?.name).toBe('pluginB')
  })

  test('hookFirst', async () => {
    pluginAMocks.install.mockReset()
    pluginBMocks.install.mockReset()

    // hookFirst runs until a plugin returns a non-nullish value
    // Since install() returns void, it runs through all plugins
    const { plugin } = await pluginManager.hookFirst({
      hookName: 'install',
      parameters: [{ config, events: new AsyncEventEmitter<KubbEvents>() }] as any,
    })

    // All plugins are called since install returns void
    expect(plugin).toBeDefined()
    expect(pluginAMocks.install).toHaveBeenCalled()
    expect(pluginBMocks.install).toHaveBeenCalled()
  })

  test('hookFirstSync', () => {
    pluginAMocks.install.mockReset()
    pluginBMocks.install.mockReset()

    // hookFirstSync runs until a plugin returns a non-nullish value
    // Since install() returns void, it runs through all plugins
    const { plugin } = pluginManager.hookFirstSync({
      hookName: 'install',
      parameters: [{ config, events: new AsyncEventEmitter<KubbEvents>() }] as any,
    })

    // All plugins are called since install returns void
    expect(plugin).toBeDefined()
    expect(pluginAMocks.install).toHaveBeenCalled()
    expect(pluginBMocks.install).toHaveBeenCalled()
  })

  test('hookParallel', async () => {
    pluginAMocks.install.mockReset()
    pluginBMocks.install.mockReset()

    await pluginManager.hookParallel({
      hookName: 'install',
      parameters: [{ config, events: new AsyncEventEmitter<KubbEvents>() }] as any,
    })

    expect(pluginAMocks.install).toHaveBeenCalled()
    expect(pluginBMocks.install).toHaveBeenCalled()
  })

  test('resolvePath without `pluginKey`', () => {
    const resolvedPath = pluginManager.resolvePath({
      baseName: 'baseName.ts',
    })

    // Uses the first plugin's registered resolver
    expect(resolvedPath).toContain('pluginA/gen/baseName.ts')
    expect(pluginAMocks.resolvePath).toHaveBeenCalled()
  })
  test('resolvePath with `pluginKey`', () => {
    pluginBMocks.resolvePath.mockReset()
    const resolvedPath = pluginManager.resolvePath({
      baseName: 'fileNameB.ts',
      pluginKey: ['pluginB', 1],
    })

    // Uses the resolver registered for pluginB
    expect(resolvedPath).toContain('pluginB/gen/fileNameB.ts')
    expect(pluginBMocks.resolvePath).toHaveBeenCalled()
  })

  test('resolvePath with `pluginKey` partial match', () => {
    pluginBMocks.resolvePath.mockReset()
    const resolvedPath = pluginManager.resolvePath({
      baseName: 'fileNameB.ts',
      pluginKey: ['pluginB'],
    })

    // Uses the first pluginB match
    expect(resolvedPath).toContain('pluginB/gen/fileNameB.ts')
  })

  test('resolveName without `pluginKey`', () => {
    const name = pluginManager.resolveName({
      name: 'Name',
    })

    // Uses the first plugin's registered resolver
    expect(name).toBe('pluginAName')
  })
  test('resolveName with `pluginKey`', () => {
    const name = pluginManager.resolveName({
      name: 'Name',
      pluginKey: ['pluginB', '1'],
    })

    // Uses the resolver registered for pluginB
    expect(name).toBe('pluginBName')
  })

  test('hookForPlugin with install', async () => {
    await pluginManager.hookForPlugin({
      pluginKey: ['pluginB'],
      hookName: 'install',
      parameters: [{ config, events: new AsyncEventEmitter<KubbEvents>() }] as any,
    })

    expect(pluginBMocks.install).toHaveBeenCalled()
  })

  it('should handle plugin hook errors gracefully', async () => {
    const errorPlugin = definePlugin(() => {
      return {
        name: 'errorPlugin',
        options: undefined as any,
        context: undefined as never,
        key: ['errorPlugin'],
        install() {
          throw new Error('Install failed')
        },
      }
    })

    const errorConfig = {
      ...config,
      plugins: [errorPlugin({})] as Plugin[],
    } satisfies Config

    const errorPluginManager = new PluginManager(errorConfig, {
      fabric: createFabric(),
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    const errorSpy = vi.fn()
    errorPluginManager.events.on('error', errorSpy)

    const result = await errorPluginManager.hookFirst({
      hookName: 'install',
      parameters: [] as any,
    })

    expect(result.result).toBeNull()
    expect(errorSpy).toHaveBeenCalled()
  })

  test('resolvePath should return default path when no plugins have resolvePath', () => {
    const noResolvePlugin = definePlugin(() => {
      return {
        name: 'noResolvePlugin',
        options: undefined as any,
        context: undefined as never,
        key: ['noResolvePlugin'],
      }
    })

    const noResolveConfig = {
      ...config,
      plugins: [noResolvePlugin({})] as Plugin[],
    } satisfies Config

    const noResolvePluginManager = new PluginManager(noResolveConfig, {
      fabric: createFabric(),
      events: new AsyncEventEmitter<KubbEvents>(),
    })

    const path = noResolvePluginManager.resolvePath({
      baseName: 'test.ts',
    })

    expect(path).toContain('test.ts')
  })

  test('getFile should create file with correct properties', () => {
    const file = pluginManager.getFile({
      name: 'testFile',
      extname: '.ts',
      pluginKey: ['pluginA'],
    })

    expect(file).toBeDefined()
    expect(file.baseName).toBe('testFile.ts')
    expect(file.path).toBeDefined()
  })

  test('getFile should work with custom mode', () => {
    const file = pluginManager.getFile({
      name: 'testFile',
      extname: '.ts',
      mode: 'single',
      pluginKey: ['pluginA'],
    })

    expect(file).toBeDefined()
    expect(file.baseName).toBe('testFile.ts')
  })

  test('getPluginsByKey should return correct plugins', () => {
    const plugins = pluginManager.getPluginsByKey('install', ['pluginB'])

    expect(plugins).toBeDefined()
    expect(plugins?.length).toBeGreaterThan(0)
    expect(plugins?.[0]?.name).toBe('pluginB')
  })

  test('getPluginsByKey should return empty array for non-existent plugin', () => {
    const plugins = pluginManager.getPluginsByKey('install', ['nonExistent'])

    expect(plugins).toEqual([])
  })
})
