import { createFile } from '@kubb/ast'
import type { FileNode } from '@kubb/ast'
import { createMockedAdapter, createMockedPlugin } from '@kubb/core/mocks'
import { describe, expect, it } from 'vitest'
import { generatePerPluginBarrel } from './generatePerPluginBarrel.ts'
import { generateRootBarrel } from './generateRootBarrel.ts'

function makeFile(path: string): FileNode {
  return createFile({
    path,
    baseName: path.split('/').pop() as `${string}.${string}`,
    sources: [],
    imports: [],
    exports: [],
  })
}

const ROOT = '/workspace'
const OUTPUT = 'src/gen'

function makeConfig() {
  return {
    root: ROOT,
    input: { path: './petstore.yaml' },
    output: { path: OUTPUT, clean: true },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [],
  }
}

describe('generatePerPluginBarrel', () => {
  it("generates barrel for a plugin's output directory", () => {
    const plugin = createMockedPlugin({
      name: 'plugin-ts',
      options: { output: { path: 'types' } } as any,
    })
    const config = makeConfig()
    const files = [
      makeFile(`${ROOT}/${OUTPUT}/types/pet.ts`),
      makeFile(`${ROOT}/${OUTPUT}/types/user.ts`),
    ]

    const barrels = generatePerPluginBarrel({ barrelType: 'all', plugin, files, config })

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.path).toBe(`${ROOT}/${OUTPUT}/types/index.ts`)
    expect(barrels[0]!.exports).toHaveLength(2)
  })

  it('returns empty when no files belong to the plugin output', () => {
    const plugin = createMockedPlugin({
      name: 'plugin-ts',
      options: { output: { path: 'types' } } as any,
    })
    const config = makeConfig()
    const files = [makeFile(`${ROOT}/${OUTPUT}/schemas/petSchema.ts`)]

    const barrels = generatePerPluginBarrel({ barrelType: 'all', plugin, files, config })

    expect(barrels).toHaveLength(0)
  })

  it('respects the barrelType strategy', () => {
    const plugin = createMockedPlugin({
      name: 'plugin-ts',
      options: { output: { path: 'types' } } as any,
    })
    const config = makeConfig()
    const files = [
      makeFile(`${ROOT}/${OUTPUT}/types/sub/pet.ts`),
    ]

    const propagateBarrels = generatePerPluginBarrel({ barrelType: 'propagate', plugin, files, config })

    // propagate: root barrel + sub/ barrel
    expect(propagateBarrels).toHaveLength(2)
  })
})

describe('generateRootBarrel', () => {
  it('generates a root barrel for all files inside the output directory', () => {
    const config = makeConfig()
    const files = [
      makeFile(`${ROOT}/${OUTPUT}/types/pet.ts`),
      makeFile(`${ROOT}/${OUTPUT}/schemas/petSchema.ts`),
    ]

    const barrels = generateRootBarrel({ barrelType: 'all', files, config })

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.path).toBe(`${ROOT}/${OUTPUT}/index.ts`)
    expect(barrels[0]!.exports).toHaveLength(2)
  })

  it('returns empty when no files are inside the root output path', () => {
    const config = makeConfig()
    const barrels = generateRootBarrel({ barrelType: 'all', files: [], config })
    expect(barrels).toHaveLength(0)
  })

  it("uses 'named' strategy and produces named exports", () => {
    const config = makeConfig()
    const files = [makeFile(`${ROOT}/${OUTPUT}/types/pet.ts`)]

    // no sources → falls back to wildcard in named mode
    const barrels = generateRootBarrel({ barrelType: 'named', files, config })

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.exports[0]?.name).toBeUndefined() // wildcard
  })
})
