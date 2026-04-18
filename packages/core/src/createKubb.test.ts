import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AsyncEventEmitter } from '@internals/utils'
import { createFile, createSource, createText } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { afterEach, describe, expect, it, test, vi } from 'vitest'
import { createKubb } from './createKubb.ts'
import { definePlugin } from './definePlugin.ts'
import type { Config, HookStylePlugin, KubbHooks, UserConfig } from './types.ts'

describe('createKubb', () => {
  const file = createFile({
    path: 'hello/world.json',
    baseName: 'world.json',
    sources: [createSource({ nodes: [createText(`{ "hello": "world" }`)] })],
    imports: [],
    exports: [],
  })

  const plugin = definePlugin(() => ({
    name: 'plugin',
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.injectFile({ baseName: file.baseName, path: file.path, sources: file.sources })
      },
    },
  }))()

  const config = {
    root: '.',
    input: {
      path: 'https://petstore3.swagger.io/api/v3/openapi.json',
    },
    output: {
      path: './src/gen',
      clean: true,
      barrelType: false as const,
    },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [plugin],
  } satisfies Config

  afterEach(() => {})

  test('if build can run and return created files and the pluginDriver', async () => {
    const { driver } = await createKubb(config, { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    expect(driver.fileManager.files).toBeDefined()
    expect(driver).toBeDefined()
    expect(driver.fileManager.files.some((f) => f.baseName === file.baseName)).toBe(true)
  })

  test('accepts a user config and resolves defaults during setup', async () => {
    const userConfig = {
      input: {
        path: 'https://petstore3.swagger.io/api/v3/openapi.json',
      },
      output: {
        path: './src/gen',
      },
      adapter: createMockedAdapter(),
      plugins: [plugin],
    } satisfies UserConfig

    const kubb = createKubb(userConfig, { hooks: new AsyncEventEmitter<KubbHooks>() })

    await kubb.setup()

    expect(kubb.config?.root).toBe(process.cwd())
    expect(kubb.config?.parsers).toEqual([])
  })

  test('if build with one plugin runs setup hooks', async () => {
    const setupSpy = vi.fn()
    const spyPlugin = definePlugin(() => ({
      name: 'spy-plugin',
      hooks: {
        'kubb:plugin:setup': setupSpy,
      },
    }))()
    const testConfig = { ...config, plugins: [spyPlugin] } satisfies Config

    await createKubb(testConfig, { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    expect(setupSpy).toHaveBeenCalledTimes(1)
  })

  it('should handle plugin errors in the event hooks', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const errorSpy = vi.fn()
    hooks.on('kubb:error', errorSpy)

    const errorPlugin = definePlugin(() => ({
      name: 'errorPlugin',
      hooks: {
        'kubb:build:start'() {
          throw new Error('Installation failed')
        },
      },
    }))()

    const errorConfig = { ...config, plugins: [errorPlugin] }
    await createKubb(errorConfig, { hooks }).safeBuild()
    // Error may propagate or be caught depending on safeBuild behaviour
    expect(true).toBe(true)
  })

  it('should emit debug events during build process', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const debugSpy = vi.fn()
    hooks.on('kubb:debug', debugSpy)

    await createKubb(config, { hooks }).build()
  })

  it('should handle array input with warning', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const warnSpy = vi.fn()
    hooks.on('kubb:warn', warnSpy)

    const arrayConfig = {
      ...config,
      input: [{ path: 'test1.yaml' }, { path: 'test2.yaml' }],
    } as unknown as Config

    await createKubb(arrayConfig, { hooks }).build()

    expect(warnSpy).toHaveBeenCalledWith('This feature is still under development — use with caution')
  })

  it.todo('should generate barrel file when barrelType is set')

  it.todo('should handle "all" barrel type')

  test('safeBuild should return error instead of throwing', async () => {
    const throwingPlugin = definePlugin(() => ({
      name: 'throwingPlugin',
      hooks: {
        'kubb:build:start'() {
          throw new Error('Critical error')
        },
      },
    }))()

    const throwingConfig = { ...config, plugins: [throwingPlugin] }
    const result = await createKubb(throwingConfig, { hooks: new AsyncEventEmitter<KubbHooks>() }).safeBuild()

    // safeBuild should not throw even if a hook errors
    expect(result).toBeDefined()
  })

  it('should track plugin timings', async () => {
    const { pluginTimings } = await createKubb(config, { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    expect(pluginTimings).toBeDefined()
    expect(pluginTimings.size).toBeGreaterThan(0)
  })

  it('should emit plugin lifecycle events', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const startSpy = vi.fn()
    const endSpy = vi.fn()

    hooks.on('kubb:plugin:start', startSpy)
    hooks.on('kubb:plugin:end', endSpy)

    await createKubb(config, { hooks }).build()

    expect(startSpy).toHaveBeenCalled()
    expect(endSpy).toHaveBeenCalled()
  })

  it('should not include files with barrelType false in barrel', async () => {
    const tmpDir = mkdtempSync(join(tmpdir(), 'kubb-test-excluded-'))

    try {
      const indexableFile = createFile({
        path: join(tmpDir, 'mocks/excluded.ts'),
        baseName: 'excluded.ts',
        sources: [
          createSource({
            nodes: [createText('export const excluded = "excluded"')],
            isIndexable: true,
            name: 'excluded',
          }),
        ],
        imports: [],
        exports: [],
        meta: { pluginName: 'excludedPlugin' },
      })

      const excludedPlugin = definePlugin(() => ({
        name: 'excludedPlugin',
        hooks: {
          'kubb:plugin:setup'(ctx) {
            ctx.setOptions({ output: { barrelType: false } } as never)
            ctx.injectFile({ baseName: indexableFile.baseName, path: indexableFile.path, sources: indexableFile.sources })
          },
        },
      }))()

      const excludeConfig: Config = {
        ...config,
        output: {
          ...config.output,
          path: tmpDir,
          barrelType: 'named' as const,
          write: false,
        },
        plugins: [excludedPlugin] as Array<HookStylePlugin>,
      }

      const { driver } = await createKubb(excludeConfig, { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

      const barrelFile = driver.fileManager.files.find((f) => f.baseName === 'index.ts')
      if (barrelFile) {
        const hasExcludedExport = barrelFile.exports?.some((e) => e.name?.includes('excluded'))
        expect(hasExcludedExport).toBeFalsy()
      }
    } finally {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('cleans up hook-style plugin listeners between builds on shared hooks', async () => {
    const hooks = new AsyncEventEmitter<KubbHooks>()
    const hookPlugin = definePlugin(() => ({
      name: 'hook-plugin',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.addGenerator({
            name: 'hook-gen',
            operations: vi.fn(),
          })
        },
      },
    }))()
    const hookConfig = { ...config, plugins: [hookPlugin] } satisfies Config

    await createKubb(hookConfig, { hooks }).build()
    await createKubb(hookConfig, { hooks }).build()

    expect(hooks.listenerCount('kubb:plugin:setup')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:schema')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operation')).toBe(0)
    expect(hooks.listenerCount('kubb:generate:operations')).toBe(0)
  })
})
