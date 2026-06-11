import { createFile, createSource, createText } from '@kubb/ast'
import { createMockedAdapter, createMockedPlugin } from '@kubb/core/mocks'
import type { Config } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { getBarrelFiles, getPluginOutputPrefix, isExcludedPath } from './utils.ts'

function makeConfig(): Config {
  return {
    root: '/workspace',
    input: { path: './petstore.yaml' },
    output: { path: 'src/gen', clean: true },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [],
  } as unknown as Config
}

function makeFile(filePath: string, names: Array<string> = []) {
  return createFile({
    path: filePath,
    baseName: filePath.split('/').pop() as `${string}.${string}`,
    sources: names.map((name) => createSource({ name, isIndexable: true, nodes: [createText(`export const ${name} = null`)] })),
    imports: [],
    exports: [],
  })
}

const ROOT = '/workspace/src/gen/types'

describe('getBarrelFiles', () => {
  it('returns an empty array when there are no files under outputPath', () => {
    const result = [...getBarrelFiles({ outputPath: ROOT, files: [], barrelType: 'all' })]
    expect(result).toHaveLength(0)
  })

  it('generates a single wildcard barrel for flat files with barrelType all', () => {
    const files = [makeFile(`${ROOT}/pet.ts`), makeFile(`${ROOT}/user.ts`)]
    const barrels = [...getBarrelFiles({ outputPath: ROOT, files, barrelType: 'all' })]

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.path).toBe(`${ROOT}/index.ts`)
    expect(barrels[0]!.exports.map((e) => e.path)).toStrictEqual(expect.arrayContaining(['./pet.ts', './user.ts']))
  })

  it('generates named exports with barrelType named', () => {
    const files = [makeFile(`${ROOT}/pet.ts`, ['Pet', 'createPet'])]
    const barrels = [...getBarrelFiles({ outputPath: ROOT, files, barrelType: 'named' })]

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.exports[0]?.name).toStrictEqual(expect.arrayContaining(['Pet', 'createPet']))
  })

  it('generates hierarchical barrels when nested is true', () => {
    const files = [makeFile(`${ROOT}/pets/listPets.ts`), makeFile(`${ROOT}/users/getUser.ts`)]
    const barrels = [...getBarrelFiles({ outputPath: ROOT, files, barrelType: 'all', nested: true })]

    expect(barrels.map((b) => b.path)).toStrictEqual(expect.arrayContaining([`${ROOT}/index.ts`, `${ROOT}/pets/index.ts`, `${ROOT}/users/index.ts`]))
  })

  it('generates per-subdirectory barrels when recursive is true', () => {
    const files = [makeFile(`${ROOT}/pets/listPets.ts`), makeFile(`${ROOT}/users/getUser.ts`)]
    const barrels = [...getBarrelFiles({ outputPath: ROOT, files, barrelType: 'all', recursive: true })]

    expect(barrels.map((b) => b.path)).toStrictEqual(expect.arrayContaining([`${ROOT}/index.ts`, `${ROOT}/pets/index.ts`, `${ROOT}/users/index.ts`]))
  })
})

describe('getPluginOutputPrefix', () => {
  it('returns a POSIX path ending with a trailing slash', () => {
    const plugin = createMockedPlugin({ name: 'plugin-ts', options: { output: { path: 'types' } } as any })
    const prefix = getPluginOutputPrefix(plugin, makeConfig())

    expect(prefix).toBe('/workspace/src/gen/types/')
    expect(prefix.endsWith('/')).toBe(true)
  })
})

describe('isExcludedPath', () => {
  const prefixes = new Set(['/workspace/src/gen/types/', '/workspace/src/gen/schemas/'])

  it('returns true when the path is inside an excluded directory', () => {
    expect(isExcludedPath('/workspace/src/gen/types/pet.ts', prefixes)).toBe(true)
  })

  it('returns false when the path is not under any excluded prefix', () => {
    expect(isExcludedPath('/workspace/src/gen/clients/petClient.ts', prefixes)).toBe(false)
  })

  it('does not match sibling directories that share a prefix substring', () => {
    expect(isExcludedPath('/workspace/src/gen/typesExtra/pet.ts', prefixes)).toBe(false)
  })

  it('returns false when the prefix set is empty', () => {
    expect(isExcludedPath('/workspace/src/gen/types/pet.ts', new Set())).toBe(false)
  })
})
