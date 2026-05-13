import { createFile, createSource, createText } from '@kubb/ast'
import { createKubb, definePlugin, memoryStorage } from '@kubb/core'
import type { Config, Plugin } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { middlewareBarrel } from './middleware.ts'

function makeFile(filePath: string, name: string) {
  return createFile({
    path: filePath,
    baseName: filePath.split('/').pop() as `${string}.${string}`,
    sources: [createSource({ name, isIndexable: true, nodes: [createText(`export const ${name} = null`)] })],
    imports: [],
    exports: [],
  })
}

function makePlugin(name: string, outputPath: string, filePath: string, exportName: string) {
  return definePlugin(() => ({
    name,
    hooks: {
      'kubb:plugin:setup'(ctx) {
        ctx.setOptions({ output: { path: outputPath } })
        ctx.injectFile(makeFile(filePath, exportName))
      },
    },
  }))()
}

describe('middlewareBarrel', () => {
  it('generates plugin and root barrels from streamed file batches', async () => {
    const storage = memoryStorage()
    const config = {
      root: '/workspace',
      output: { path: 'src/gen', barrel: { type: 'named' } },
      parsers: [],
      plugins: [
        makePlugin('plugin-types', 'types', '/workspace/src/gen/types/pet.ts', 'Pet'),
        makePlugin('plugin-schemas', 'schemas', '/workspace/src/gen/schemas/petSchema.ts', 'PetSchema'),
      ] as unknown as Array<Plugin>,
      middleware: [middlewareBarrel()],
      storage,
    } satisfies Config

    const { files } = await createKubb(config).build()
    const paths = files.map((file) => file.path)

    expect(paths).toEqual(
      expect.arrayContaining([
        '/workspace/src/gen/types/pet.ts',
        '/workspace/src/gen/types/index.ts',
        '/workspace/src/gen/schemas/petSchema.ts',
        '/workspace/src/gen/schemas/index.ts',
        '/workspace/src/gen/index.ts',
      ]),
    )
    expect(files.find((file) => file.path === '/workspace/src/gen/index.ts')?.exports.flatMap((item) => item.name ?? [])).toEqual(
      expect.arrayContaining(['Pet', 'PetSchema']),
    )
  })
})
