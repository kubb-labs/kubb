import { createFile } from '@kubb/ast'
import type { FileNode } from '@kubb/ast'
import { createMockedAdapter, createMockedPlugin } from '@kubb/core/mocks'
import { describe, expect, it } from 'vitest'
import { generatePerPluginBarrel } from './generatePerPluginBarrel.ts'

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

function makePlugin() {
  return createMockedPlugin({
    name: 'plugin-ts',
    options: { output: { path: 'types' } } as any,
  })
}

describe('generatePerPluginBarrel', () => {
  it("generates a barrel for the plugin's output directory", () => {
    const files = [makeFile(`${ROOT}/${OUTPUT}/types/pet.ts`), makeFile(`${ROOT}/${OUTPUT}/types/user.ts`)]

    const barrels = generatePerPluginBarrel({ barrelType: 'all', plugin: makePlugin(), files, config: makeConfig() })

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.path).toBe(`${ROOT}/${OUTPUT}/types/index.ts`)
    expect(barrels[0]!.exports).toHaveLength(2)
  })

  it('returns empty when no files belong to the plugin output', () => {
    const files = [makeFile(`${ROOT}/${OUTPUT}/schemas/petSchema.ts`)]

    const barrels = generatePerPluginBarrel({ barrelType: 'all', plugin: makePlugin(), files, config: makeConfig() })

    expect(barrels).toHaveLength(0)
  })

  it("emits a barrel per directory when barrelType is 'propagate'", () => {
    const files = [makeFile(`${ROOT}/${OUTPUT}/types/sub/pet.ts`)]

    const barrels = generatePerPluginBarrel({ barrelType: 'propagate', plugin: makePlugin(), files, config: makeConfig() })

    expect(barrels).toHaveLength(2)
  })
})
