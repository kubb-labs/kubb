import { ast } from '@kubb/ast'
import { createKubb, definePlugin, memoryStorage } from '@kubb/core'
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

async function build({ barrel = { type: 'named' }, plugins }: { barrel?: Config['output']['barrel']; plugins: Array<Plugin> }) {
  const config = {
    root: '/workspace',
    output: { path: 'src/gen', barrel },
    parsers: [],
    reporters: [],
    plugins: [...plugins, pluginBarrel()] as unknown as Array<Plugin>,
    storage: memoryStorage(),
  } satisfies Config

  const { files } = await createKubb(config).build()

  return {
    paths: files.map((file) => file.path),
    file: (path: string) => files.find((file) => file.path === path),
    rootExportNames: () => files.find((file) => file.path === '/workspace/src/gen/index.ts')?.exports.flatMap((item) => item.name ?? []),
  }
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
    expect(rootExportNames()).toStrictEqual(expect.arrayContaining(['Pet', 'PetSchema']))
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
    const { file } = await build({ plugins: [typesPlugin(output)] })
    const barrel = file('/workspace/src/gen/types/index.ts')

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
    expect(rootExportNames()).toContain('Pet')
  })

  it('excludes a barrel:false file-mode plugin from the root barrel', async () => {
    const { rootExportNames } = await build({
      plugins: [
        makePlugin({
          name: 'plugin-types',
          outputPath: 'types.ts',
          filePath: '/workspace/src/gen/types.ts',
          exportName: 'Pet',
          output: { mode: 'file', barrel: false },
        }),
        schemasPlugin(),
      ],
    })

    expect(rootExportNames()).not.toContain('Pet')
    expect(rootExportNames()).toContain('PetSchema')
  })
})
