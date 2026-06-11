import { createFile, createSource, createText } from '@kubb/ast'
import { createKubb, definePlugin, memoryStorage } from '@kubb/core'
import type { Config, Plugin } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { pluginBarrel } from './plugin.ts'

function makeFile(filePath: string, name: string) {
  return createFile({
    path: filePath,
    baseName: filePath.split('/').pop() as `${string}.${string}`,
    sources: [createSource({ name, isIndexable: true, nodes: [createText(`export const ${name} = null`)] })],
    imports: [],
    exports: [],
  })
}

function makePlugin({
  name,
  outputPath,
  filePath,
  exportName,
  output,
}: {
  name: string
  outputPath: string
  filePath: string
  exportName: string
  output?: Record<string, unknown>
}) {
  return definePlugin(() => ({
    name,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({ output: { path: outputPath, ...output } })
        ctx.setResolver({})
        ctx.injectFile(makeFile(filePath, exportName))
      },
    },
  }))()
}

describe('pluginBarrel', () => {
  it('generates plugin and root barrels from streamed file batches', async () => {
    const storage = memoryStorage()
    const config = {
      root: '/workspace',
      output: { path: 'src/gen', barrel: { type: 'named' } },
      parsers: [],
      reporters: [],
      plugins: [
        makePlugin({ name: 'plugin-types', outputPath: 'types', filePath: '/workspace/src/gen/types/pet.ts', exportName: 'Pet' }),
        makePlugin({ name: 'plugin-schemas', outputPath: 'schemas', filePath: '/workspace/src/gen/schemas/petSchema.ts', exportName: 'PetSchema' }),
        pluginBarrel(),
      ] as unknown as Array<Plugin>,
      storage,
    } satisfies Config

    const { files } = await createKubb(config).build()
    const paths = files.map((file) => file.path)

    expect(paths).toStrictEqual(
      expect.arrayContaining([
        '/workspace/src/gen/types/pet.ts',
        '/workspace/src/gen/types/index.ts',
        '/workspace/src/gen/schemas/petSchema.ts',
        '/workspace/src/gen/schemas/index.ts',
        '/workspace/src/gen/index.ts',
      ]),
    )
    expect(files.find((file) => file.path === '/workspace/src/gen/index.ts')?.exports.flatMap((item) => item.name ?? [])).toStrictEqual(
      expect.arrayContaining(['Pet', 'PetSchema']),
    )
  })

  it('leaves barrels banner-free by default', async () => {
    const storage = memoryStorage()
    const config = {
      root: '/workspace',
      output: { path: 'src/gen', barrel: { type: 'named' } },
      parsers: [],
      reporters: [],
      plugins: [
        makePlugin({ name: 'plugin-types', outputPath: 'types', filePath: '/workspace/src/gen/types/pet.ts', exportName: 'Pet' }),
        pluginBarrel(),
      ] as unknown as Array<Plugin>,
      storage,
    } satisfies Config

    const { files } = await createKubb(config).build()
    const barrel = files.find((file) => file.path === '/workspace/src/gen/types/index.ts')

    expect(barrel?.banner).toBeUndefined()
    expect(barrel?.footer).toBeUndefined()
  })

  it('applies a configured plugin banner/footer to its barrel', async () => {
    const storage = memoryStorage()
    const config = {
      root: '/workspace',
      output: { path: 'src/gen', barrel: { type: 'named' } },
      parsers: [],
      reporters: [],
      plugins: [
        makePlugin({
          name: 'plugin-types',
          outputPath: 'types',
          filePath: '/workspace/src/gen/types/pet.ts',
          exportName: 'Pet',
          output: { banner: '// header', footer: '// footer' },
        }),
        pluginBarrel(),
      ] as unknown as Array<Plugin>,
      storage,
    } satisfies Config

    const { files } = await createKubb(config).build()
    const barrel = files.find((file) => file.path === '/workspace/src/gen/types/index.ts')

    expect(barrel?.banner).toBe('// header')
    expect(barrel?.footer).toBe('// footer')
  })

  it('passes isBarrel to a banner function so it can skip re-export files', async () => {
    const storage = memoryStorage()
    const config = {
      root: '/workspace',
      output: { path: 'src/gen', barrel: { type: 'named' } },
      parsers: [],
      reporters: [],
      plugins: [
        makePlugin({
          name: 'plugin-types',
          outputPath: 'types',
          filePath: '/workspace/src/gen/types/pet.ts',
          exportName: 'Pet',
          output: { banner: (meta: { isBarrel: boolean }) => (meta.isBarrel ? '' : "'use server'") },
        }),
        pluginBarrel(),
      ] as unknown as Array<Plugin>,
      storage,
    } satisfies Config

    const { files } = await createKubb(config).build()
    const barrel = files.find((file) => file.path === '/workspace/src/gen/types/index.ts')

    expect(barrel?.banner).toBe('')
  })

  it("skips the per-plugin barrel for output.mode 'file' and re-exports the single file from the root barrel", async () => {
    const storage = memoryStorage()
    const config = {
      root: '/workspace',
      output: { path: 'src/gen', barrel: { type: 'named' } },
      parsers: [],
      reporters: [],
      plugins: [
        makePlugin({
          name: 'plugin-types',
          outputPath: 'types.ts',
          filePath: '/workspace/src/gen/types.ts',
          exportName: 'Pet',
          output: { mode: 'file' },
        }),
        pluginBarrel(),
      ] as unknown as Array<Plugin>,
      storage,
    } satisfies Config

    const { files } = await createKubb(config).build()
    const paths = files.map((file) => file.path)

    expect(paths).not.toContain('/workspace/src/gen/types.ts/index.ts')
    expect(paths).toContain('/workspace/src/gen/types.ts')
    const rootBarrel = files.find((file) => file.path === '/workspace/src/gen/index.ts')
    expect(rootBarrel?.exports.flatMap((item) => item.name ?? [])).toContain('Pet')
  })

  it('excludes a barrel:false file-mode plugin from the root barrel', async () => {
    const storage = memoryStorage()
    const config = {
      root: '/workspace',
      output: { path: 'src/gen', barrel: { type: 'named' } },
      parsers: [],
      reporters: [],
      plugins: [
        makePlugin({
          name: 'plugin-types',
          outputPath: 'types.ts',
          filePath: '/workspace/src/gen/types.ts',
          exportName: 'Pet',
          output: { mode: 'file', barrel: false },
        }),
        makePlugin({ name: 'plugin-schemas', outputPath: 'schemas', filePath: '/workspace/src/gen/schemas/petSchema.ts', exportName: 'PetSchema' }),
        pluginBarrel(),
      ] as unknown as Array<Plugin>,
      storage,
    } satisfies Config

    const { files } = await createKubb(config).build()
    const rootBarrel = files.find((file) => file.path === '/workspace/src/gen/index.ts')
    const exportedNames = rootBarrel?.exports.flatMap((item) => item.name ?? [])

    expect(exportedNames).not.toContain('Pet')
    expect(exportedNames).toContain('PetSchema')
  })
})
