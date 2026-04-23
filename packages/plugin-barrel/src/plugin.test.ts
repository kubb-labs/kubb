import { join } from 'node:path'
import { AsyncEventEmitter } from '@internals/utils'
import { createFile, createSource, createText } from '@kubb/ast'
import { createKubb, definePlugin } from '@kubb/core'
import { createMockedAdapter } from '@kubb/core/mocks'
import type { Config, KubbHooks, Plugin } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { pluginBarrel } from './plugin.ts'

/**
 * Helpers
 */
function makeIndexableFile(path: string, baseName: `${string}.${string}`, name: string, pluginName: string) {
  return createFile({
    path,
    baseName,
    sources: [
      createSource({
        nodes: [createText(`export const ${name} = '${name}'`)],
        isIndexable: true,
        name,
      }),
    ],
    imports: [],
    exports: [],
    meta: { pluginName },
  })
}

const OUTPUT_DIR = '/tmp/kubb-plugin-barrel-test'

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    root: OUTPUT_DIR,
    input: { path: 'https://petstore3.swagger.io/api/v3/openapi.json' },
    output: { path: 'gen', write: false, barrelType: false },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [],
    ...overrides,
  } as Config
}

describe('pluginBarrel', () => {
  it('generates per-plugin index.ts barrel files', async () => {
    const typeFile = makeIndexableFile(join(OUTPUT_DIR, 'gen/types/Pet.ts'), 'Pet.ts', 'Pet', 'plugin-ts')

    const mockPlugin = definePlugin(() => ({
      name: 'plugin-ts',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setOptions({ output: { path: 'types' } } as never)
          ctx.injectFile(typeFile)
        },
      },
    }))()

    const config = makeConfig({
      plugins: [mockPlugin, pluginBarrel({ plugins: [{ name: 'plugin-ts', barrelType: 'named' }] })] as unknown as Array<Plugin>,
    })

    const { driver } = await createKubb(config, { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    const barrelFile = driver.fileManager.files.find((f) => f.baseName === 'index.ts' && f.path.includes('types'))
    expect(barrelFile).toBeDefined()
    expect(barrelFile?.exports?.some((e) => Array.isArray(e.name) && e.name.includes('Pet'))).toBe(true)
  })

  it('skips per-plugin barrel when barrelType is false', async () => {
    const typeFile = makeIndexableFile(join(OUTPUT_DIR, 'gen/types/Pet.ts'), 'Pet.ts', 'Pet', 'plugin-ts')

    const mockPlugin = definePlugin(() => ({
      name: 'plugin-ts',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setOptions({ output: { path: 'types' } } as never)
          ctx.injectFile(typeFile)
        },
      },
    }))()

    const config = makeConfig({
      plugins: [mockPlugin, pluginBarrel({ plugins: [{ name: 'plugin-ts', barrelType: false }] })] as unknown as Array<Plugin>,
    })

    const { driver } = await createKubb(config, { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    const barrelFile = driver.fileManager.files.find((f) => f.baseName === 'index.ts' && f.path.includes('types'))
    expect(barrelFile).toBeUndefined()
  })

  it('generates root index.ts with named exports', async () => {
    const typeFile = makeIndexableFile(join(OUTPUT_DIR, 'gen/types/Pet.ts'), 'Pet.ts', 'Pet', 'plugin-ts')

    const mockPlugin = definePlugin(() => ({
      name: 'plugin-ts',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setOptions({ output: { path: 'types' } } as never)
          ctx.injectFile(typeFile)
        },
      },
    }))()

    const config = makeConfig({
      plugins: [
        mockPlugin,
        pluginBarrel({
          root: { barrelType: 'named' },
          plugins: [{ name: 'plugin-ts', barrelType: 'named' }],
        }),
      ] as unknown as Array<Plugin>,
    })

    const { driver } = await createKubb(config, { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    const rootBarrel = driver.fileManager.files.find((f) => f.baseName === 'index.ts' && f.path === join(OUTPUT_DIR, 'gen/index.ts'))
    expect(rootBarrel).toBeDefined()
    expect(rootBarrel?.exports?.length).toBeGreaterThan(0)
  })

  it('disables root barrel when root.barrelType is false', async () => {
    const typeFile = makeIndexableFile(join(OUTPUT_DIR, 'gen/types/Pet.ts'), 'Pet.ts', 'Pet', 'plugin-ts')

    const mockPlugin = definePlugin(() => ({
      name: 'plugin-ts',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setOptions({ output: { path: 'types' } } as never)
          ctx.injectFile(typeFile)
        },
      },
    }))()

    const config = makeConfig({
      plugins: [
        mockPlugin,
        pluginBarrel({
          root: { barrelType: false },
        }),
      ] as unknown as Array<Plugin>,
    })

    const { driver } = await createKubb(config, { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    const rootBarrel = driver.fileManager.files.find((f) => f.baseName === 'index.ts' && f.path === join(OUTPUT_DIR, 'gen/index.ts'))
    expect(rootBarrel).toBeUndefined()
  })

  it('generates only one root barrel when config.output.barrelType is also set', async () => {
    const typeFile = makeIndexableFile(join(OUTPUT_DIR, 'gen/types/Pet.ts'), 'Pet.ts', 'Pet', 'plugin-ts')

    const mockPlugin = definePlugin(() => ({
      name: 'plugin-ts',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.setOptions({ output: { path: 'types' } } as never)
          ctx.injectFile(typeFile)
        },
      },
    }))()

    // config.output.barrelType is 'named' but plugin-barrel is present — should NOT double-generate
    const config = makeConfig({
      output: { path: 'gen', write: false, barrelType: 'named' },
      plugins: [
        mockPlugin,
        pluginBarrel({
          root: { barrelType: 'named' },
          plugins: [{ name: 'plugin-ts', barrelType: 'named' }],
        }),
      ] as unknown as Array<Plugin>,
    })

    const { driver } = await createKubb(config, { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    const rootBarrels = driver.fileManager.files.filter((f) => f.baseName === 'index.ts' && f.path === join(OUTPUT_DIR, 'gen/index.ts'))
    // Only one root barrel file (upserted, not duplicated)
    expect(rootBarrels.length).toBe(1)
  })

  it('falls back to plugin output.barrelType when plugin is not listed in options.plugins', async () => {
    const typeFile = makeIndexableFile(join(OUTPUT_DIR, 'gen/types/Pet.ts'), 'Pet.ts', 'Pet', 'plugin-ts')

    const mockPlugin = definePlugin(() => ({
      name: 'plugin-ts',
      hooks: {
        'kubb:plugin:setup'(ctx) {
          // plugin-ts declares its own barrelType
          ctx.setOptions({ output: { path: 'types', barrelType: 'named' } } as never)
          ctx.injectFile(typeFile)
        },
      },
    }))()

    const config = makeConfig({
      plugins: [
        mockPlugin,
        // no plugins array override — falls back to plugin-ts's own output.barrelType
        pluginBarrel({}),
      ] as unknown as Array<Plugin>,
    })

    const { driver } = await createKubb(config, { hooks: new AsyncEventEmitter<KubbHooks>() }).build()

    const barrelFile = driver.fileManager.files.find((f) => f.baseName === 'index.ts' && f.path.includes('types'))
    expect(barrelFile).toBeDefined()
  })
})
