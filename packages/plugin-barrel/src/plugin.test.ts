import { ast } from '@kubb/kit'
import { createKubb, defineExtension, Diagnostics, memoryStorage } from '@kubb/core'
import type { Config, Plugin } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { pluginBarrel } from './plugin.ts'

function makeFile(filePath: string, name: string, meta?: Record<string, unknown>) {
  return ast.factory.createFile({
    path: filePath,
    baseName: filePath.split('/').pop() as `${string}.${string}`,
    meta,
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
  meta = { pluginName: name },
}: {
  name: string
  outputPath: string
  filePath: string
  exportName: string
  output?: Record<string, unknown>
  // Resolver-built files record their owning plugin in `meta.pluginName`. Pass `{}` for a file that does not.
  meta?: Record<string, unknown>
}) {
  return defineExtension({
    kind: 'plugin',
    meta: { name },
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({ output: { path: outputPath, ...output } })
        ctx.setResolver({})
        ctx.injectFile(makeFile(filePath, exportName, meta))
      },
    },
  })()
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

function schemasPlugin(output: Record<string, unknown> = {}) {
  return makePlugin({
    name: 'plugin-schemas',
    outputPath: 'schemas',
    filePath: '/workspace/src/gen/schemas/petSchema.ts',
    exportName: 'PetSchema',
    output: { mode: 'directory', ...output },
  })
}

async function build({ plugins, barrel = { type: 'named' } }: { plugins: Array<Plugin>; barrel?: { type: 'all' | 'named' } | false }) {
  const config = {
    root: '/workspace',
    output: { path: 'src/gen', barrel },
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
  it.each(['all', 'named', false] as const)('preserves service exports with root barrel %s', async (rootType) => {
    const { files } = await build({
      barrel: rootType === false ? false : { type: rootType },
      plugins: [
        makePlugin({
          name: 'plugin-fetch',
          outputPath: 'client',
          filePath: '/workspace/src/gen/client/PetService/getPet.ts',
          exportName: 'getPet',
          output: { barrel: { type: 'named', namespace: true } },
        }),
        makePlugin({
          name: 'plugin-react-query',
          outputPath: 'hooks',
          filePath: '/workspace/src/gen/hooks/useGetPet.ts',
          exportName: 'useGetPet',
          output: { barrel: { type: 'named' } },
        }),
      ],
    })
    const client = files.find((file) => file.path === '/workspace/src/gen/client/index.ts')
    expect(client?.exports).toMatchObject([{ path: './PetService/index.ts' }, { name: 'PetService', path: './PetService/index.ts', asAlias: true }])
    expect(files.find((file) => file.baseName === 'getPet.ts')?.sources[0]?.name).toBe('getPet')
    expect(files.find((file) => file.baseName === 'useGetPet.ts')?.sources[0]?.name).toBe('useGetPet')

    const root = files.find((file) => file.path === '/workspace/src/gen/index.ts')
    if (rootType === false) {
      expect(root).toBeUndefined()
      return
    }
    expect(root?.exports.find((item) => item.asAlias)).toMatchObject({ name: 'PetService', path: './client/PetService/index.ts', asAlias: true })
  })

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
    {
      scenario: 'directory-mode without an owning plugin on its files',
      plugin: makePlugin({
        name: 'plugin-types',
        outputPath: 'types',
        filePath: '/workspace/src/gen/types/pet.ts',
        exportName: 'Pet',
        output: { mode: 'directory', barrel: false },
        meta: {},
      }),
    },
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

  it.each([
    { scenario: 'disabled', barrel: false as const, rootExports: undefined },
    { scenario: 'enabled', barrel: { type: 'named' as const }, rootExports: expect.arrayContaining(['Hello', 'Pet', 'PetSchema']) },
  ])('keeps the per-plugin barrels next to a plugin without output.path when the root barrel is $scenario', async ({ barrel, rootExports }) => {
    const helloPlugin = defineExtension({
      kind: 'plugin',
      meta: { name: 'plugin-hello' },
      hooks: {
        'kubb:plugin:setup'(ctx) {
          ctx.injectFile(makeFile('/workspace/src/gen/hello.ts', 'Hello'))
        },
      },
    })()
    const { paths, rootExportNames } = await build({
      plugins: [typesPlugin({ barrel: { type: 'named' } }), helloPlugin, schemasPlugin({ barrel: { type: 'named' } })],
      barrel,
    })

    expect(paths).toStrictEqual(
      expect.arrayContaining(['/workspace/src/gen/hello.ts', '/workspace/src/gen/types/index.ts', '/workspace/src/gen/schemas/index.ts']),
    )
    expect(rootExportNames).toStrictEqual(rootExports)
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

  it("keeps another plugin's file that sits in a barrel:false plugin's directory", async () => {
    const extraPlugin = makePlugin({
      name: 'plugin-extra',
      outputPath: 'extra',
      filePath: '/workspace/src/gen/types/extra.ts',
      exportName: 'Extra',
      output: { mode: 'directory' },
    })
    const { rootExportNames } = await build({ plugins: [typesPlugin({ barrel: false }), extraPlugin] })

    expect(rootExportNames).not.toContain('Pet')
    expect(rootExportNames).toContain('Extra')
  })

  it("keeps the other barrels when a barrel:false plugin output path is '.'", async () => {
    const rootPlugin = makePlugin({
      name: 'plugin-root',
      outputPath: '.',
      filePath: '/workspace/src/gen/client.ts',
      exportName: 'client',
      output: { mode: 'directory', barrel: false, path: '.' },
    })
    const { paths, rootExportNames } = await build({ plugins: [typesPlugin(), rootPlugin] })

    expect(paths).toContain('/workspace/src/gen/types/index.ts')
    expect(paths).toContain('/workspace/src/gen/index.ts')
    expect(rootExportNames).toContain('Pet')
    expect(rootExportNames).not.toContain('client')
  })
})
