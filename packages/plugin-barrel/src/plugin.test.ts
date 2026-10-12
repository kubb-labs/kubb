import { ast } from '@kubb/kit'
import { createKubb, definePlugin, Diagnostics, memoryStorage } from '@kubb/core'
import type { Config, Plugin } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { pluginBarrel } from './plugin.ts'

function makeFile(filePath: string, name: string) {
  return ast.factory.createFile({
    path: filePath,
    baseName: filePath.split('/').pop() as `${string}.${string}`,
    sources: [ast.factory.createSource({ name, isIndexable: true, nodes: [ast.factory.createText(`export const ${name} = null`)] })],
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

function typesPlugin(output: Record<string, unknown> = {}) {
  return makePlugin({
    name: 'plugin-types',
    outputPath: 'types',
    filePath: '/workspace/src/gen/types/pet.ts',
    exportName: 'Pet',
    output: { mode: 'directory', ...output },
  })
}

function schemasPlugin() {
  return makePlugin({
    name: 'plugin-schemas',
    outputPath: 'schemas',
    filePath: '/workspace/src/gen/schemas/petSchema.ts',
    exportName: 'PetSchema',
    output: { mode: 'directory' },
  })
}

async function build({ plugins }: { plugins: Array<Plugin> }) {
  const config = {
    root: '/workspace',
    output: { path: 'src/gen', barrel: { type: 'named' } },
    parsers: [],
    reporters: [],
    plugins: [...plugins, pluginBarrel()] as unknown as Array<Plugin>,
    storage: memoryStorage(),
  } satisfies Config

  const { files } = await createKubb(config).build()

  const rootExportNames = files.find((file) => file.path === '/workspace/src/gen/index.ts')?.exports.flatMap((item) => item.name ?? [])

  return { files, paths: files.map((file) => file.path), rootExportNames }
}

describe('pluginBarrel', () => {
  it('generates a barrel per directory-mode plugin and a root barrel re-exporting them', async () => {
    const { paths, rootExportNames } = await build({ plugins: [typesPlugin(), schemasPlugin()] })

    expect(paths).toStrictEqual(
      expect.arrayContaining([
        '/workspace/src/gen/types/pet.ts',
        '/workspace/src/gen/types/index.ts',
        '/workspace/src/gen/schemas/petSchema.ts',
        '/workspace/src/gen/schemas/index.ts',
        '/workspace/src/gen/index.ts',
      ]),
    )
    expect(rootExportNames).toStrictEqual(expect.arrayContaining(['Pet', 'PetSchema']))
  })

  it.each([
    { scenario: 'no banner or footer is configured', output: {}, banner: undefined, footer: undefined },
    { scenario: 'a plugin banner and footer are configured', output: { banner: '// header', footer: '// footer' }, banner: '// header', footer: '// footer' },
    {
      scenario: 'a banner function skips barrels via isBarrel',
      output: { banner: (meta: { isBarrel: boolean }) => (meta.isBarrel ? '' : "'use server'") },
      banner: '',
      footer: undefined,
    },
  ])('sets barrel banner to $banner and footer to $footer when $scenario', async ({ output, banner, footer }) => {
    const { files } = await build({ plugins: [typesPlugin(output)] })
    const barrel = files.find((file) => file.path === '/workspace/src/gen/types/index.ts')

    expect(barrel?.banner).toBe(banner)
    expect(barrel?.footer).toBe(footer)
  })

  it("skips the per-plugin barrel for output.mode 'file' and re-exports the single file from the root barrel", async () => {
    const { paths, rootExportNames } = await build({
      plugins: [
        makePlugin({ name: 'plugin-types', outputPath: 'types.ts', filePath: '/workspace/src/gen/types.ts', exportName: 'Pet', output: { mode: 'file' } }),
      ],
    })

    expect(paths).not.toContain('/workspace/src/gen/types.ts/index.ts')
    expect(paths).toContain('/workspace/src/gen/types.ts')
    expect(rootExportNames).toContain('Pet')
  })

  it.each([
    {
      scenario: 'file-mode',
      plugin: makePlugin({
        name: 'plugin-types',
        outputPath: 'types.ts',
        filePath: '/workspace/src/gen/types.ts',
        exportName: 'Pet',
        output: { mode: 'file', barrel: false },
      }),
    },
    { scenario: 'directory-mode', plugin: typesPlugin({ barrel: false }) },
  ])('excludes a barrel:false $scenario plugin from the root barrel', async ({ plugin }) => {
    const { paths, rootExportNames } = await build({ plugins: [plugin, schemasPlugin()] })

    expect(paths).not.toContain('/workspace/src/gen/types/index.ts')
    expect(rootExportNames).not.toContain('Pet')
    expect(rootExportNames).toContain('PetSchema')
  })

  it('reports a path traversal when a plugin output path escapes the output directory', async () => {
    const escapingPlugin = makePlugin({
      name: 'plugin-types',
      outputPath: '../outside',
      filePath: '/workspace/src/outside/pet.ts',
      exportName: 'Pet',
      output: { mode: 'directory' },
    })

    await expect(build({ plugins: [escapingPlugin] })).rejects.toMatchObject({ errors: [{ diagnostic: { code: Diagnostics.code.pathTraversal } }] })
  })

  it('keeps a plugin whose output path only shares a prefix with an excluded one', async () => {
    const extraPlugin = makePlugin({
      name: 'plugin-types-extra',
      outputPath: 'typesExtra',
      filePath: '/workspace/src/gen/typesExtra/pet.ts',
      exportName: 'PetExtra',
      output: { mode: 'directory' },
    })
    const { rootExportNames } = await build({ plugins: [typesPlugin({ barrel: false }), extraPlugin] })

    expect(rootExportNames).not.toContain('Pet')
    expect(rootExportNames).toContain('PetExtra')
  })
})
