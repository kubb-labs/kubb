import { createFile } from '@kubb/ast'
import type { FileNode } from '@kubb/ast'
import { createMockedAdapter } from '@kubb/core/mocks'
import { describe, expect, it } from 'vitest'
import { generateRootBarrel } from './generateRootBarrel.ts'

const ROOT = '/workspace'
const OUTPUT = 'src/gen'

function makeFile(path: string): FileNode {
  return createFile({
    path,
    baseName: path.split('/').pop() as `${string}.${string}`,
    sources: [],
    imports: [],
    exports: [],
  })
}

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

describe('generateRootBarrel', () => {
  it('generates a root barrel for all files inside the output directory', () => {
    const files = [makeFile(`${ROOT}/${OUTPUT}/types/pet.ts`), makeFile(`${ROOT}/${OUTPUT}/schemas/petSchema.ts`)]

    const barrels = generateRootBarrel({ barrelType: 'all', files, config: makeConfig() })

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.path).toBe(`${ROOT}/${OUTPUT}/index.ts`)
    expect(barrels[0]!.exports).toHaveLength(2)
  })

  it('returns empty when no files are inside the root output path', () => {
    const barrels = generateRootBarrel({ barrelType: 'all', files: [], config: makeConfig() })

    expect(barrels).toHaveLength(0)
  })

  it("falls back to a wildcard export in 'named' mode when files have no indexable sources", () => {
    const files = [makeFile(`${ROOT}/${OUTPUT}/types/pet.ts`)]

    const barrels = generateRootBarrel({ barrelType: 'named', files, config: makeConfig() })

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.exports[0]?.name).toBeUndefined()
  })
})
