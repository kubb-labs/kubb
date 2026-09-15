import { ast } from '@kubb/ast'
import { Diagnostics } from '@kubb/core'
import { createMockedAdapter, createMockedPlugin } from '@kubb/core/mocks'
import type { Config, Diagnostic } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { buildBarrelIndex, buildTree, getBarrelFiles, getPluginOutputPrefix, isExcludedPath } from './utils.ts'

function makeConfig(): Config {
  return {
    root: '/workspace',
    input: './petstore.yaml',
    output: { path: 'src/gen', clean: true },
    parsers: [],
    adapter: createMockedAdapter(),
    plugins: [],
  } as unknown as Config
}

function makeFile(filePath: string, names: Array<string> = []) {
  return ast.factory.createFile({
    path: filePath,
    baseName: filePath.split('/').pop() as `${string}.${string}`,
    sources: names.map((name) => ast.factory.createSource({ name, isIndexable: true, nodes: [ast.factory.createText(`export const ${name} = null`)] })),
    imports: [],
    exports: [],
  })
}

const ROOT = '/workspace/src/gen/types'

describe('getBarrelFiles', () => {
  it('returns an empty array when there are no files under outputPath', () => {
    const result = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, []), barrelType: 'all' })]
    expect(result).toHaveLength(0)
  })

  it('generates a single wildcard barrel for flat files with barrelType all', () => {
    const files = [makeFile(`${ROOT}/pet.ts`), makeFile(`${ROOT}/user.ts`)]
    const barrels = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, files), barrelType: 'all' })]

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.path).toBe(`${ROOT}/index.ts`)
    expect(barrels[0]!.exports.map((e) => e.path)).toStrictEqual(expect.arrayContaining(['./pet.ts', './user.ts']))
  })

  it('generates named exports with barrelType named', () => {
    const files = [makeFile(`${ROOT}/pet.ts`, ['Pet', 'createPet'])]
    const barrels = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, files), barrelType: 'named' })]

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.exports[0]?.name).toStrictEqual(expect.arrayContaining(['Pet', 'createPet']))
  })

  it('reports duplicate named exports and keeps the first one', () => {
    const diagnostics: Array<Diagnostic> = []
    const barrels = Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      () => [...getBarrelFiles({ index: buildBarrelIndex(ROOT, [makeFile(`${ROOT}/a.ts`, ['Pet']), makeFile(`${ROOT}/b.ts`, ['Pet'])]), barrelType: 'named' })],
    )

    expect(barrels[0]?.exports).toHaveLength(1)
    expect(diagnostics).toMatchObject([{ code: Diagnostics.code.barrelDuplicateExport, severity: 'error' }])
  })

  it('reports a type and value export with the same name', () => {
    const value = makeFile(`${ROOT}/value.ts`, ['Pet'])
    const type = ast.factory.createFile({
      path: `${ROOT}/type.ts`,
      baseName: 'type.ts',
      sources: [ast.factory.createSource({ name: 'Pet', isIndexable: true, isTypeOnly: true, nodes: [ast.factory.createText('export type Pet = {}')] })],
      imports: [],
      exports: [],
    })
    const diagnostics: Array<Diagnostic> = []
    const barrels = Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      () => [...getBarrelFiles({ index: buildBarrelIndex(ROOT, [value, type]), barrelType: 'named' })],
    )

    expect(barrels[0]?.exports).toHaveLength(1)
    expect(diagnostics).toMatchObject([{ code: Diagnostics.code.barrelDuplicateExport, severity: 'error' }])
  })

  it('reports duplicate wildcard exports', () => {
    const diagnostics: Array<Diagnostic> = []
    Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      () => [...getBarrelFiles({ index: buildBarrelIndex(ROOT, [makeFile(`${ROOT}/a.ts`, ['Pet']), makeFile(`${ROOT}/b.ts`, ['Pet'])]), barrelType: 'all' })],
    )

    expect(diagnostics).toMatchObject([{ code: Diagnostics.code.barrelDuplicateExport, severity: 'error' }])
  })

  it('reports a collision once across related barrels', () => {
    const diagnostics: Array<Diagnostic> = []
    const index = buildBarrelIndex(ROOT, [makeFile(`${ROOT}/pets/a.ts`, ['Pet']), makeFile(`${ROOT}/pets/b.ts`, ['Pet'])])
    const reportedCollisions = new Set<string>()
    Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      () => {
        const pluginBarrels = [...getBarrelFiles({ index, targetPath: `${ROOT}/pets`, barrelType: 'named', reportedCollisions })]
        const rootBarrels = [...getBarrelFiles({ index, barrelType: 'named', reportedCollisions })]
        expect(pluginBarrels).toHaveLength(1)
        expect(rootBarrels).toHaveLength(1)
      },
    )

    expect(diagnostics).toHaveLength(1)
  })

  it('generates hierarchical barrels when nested is true', () => {
    const files = [makeFile(`${ROOT}/pets/listPets.ts`), makeFile(`${ROOT}/users/getUser.ts`)]
    const barrels = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, files), barrelType: 'all', nested: true })]

    expect(barrels.map((b) => b.path)).toStrictEqual(expect.arrayContaining([`${ROOT}/index.ts`, `${ROOT}/pets/index.ts`, `${ROOT}/users/index.ts`]))
  })

  it('emits named exports for leaf files when nested and barrelType named', () => {
    const files = [makeFile(`${ROOT}/pets/listPets.ts`, ['listPets']), makeFile(`${ROOT}/users/getUser.ts`, ['getUser'])]
    const barrels = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, files), barrelType: 'named', nested: true })]

    const petsBarrel = barrels.find((b) => b.path === `${ROOT}/pets/index.ts`)!
    expect(petsBarrel.exports[0]?.name).toStrictEqual(['listPets'])

    const rootBarrel = barrels.find((b) => b.path === `${ROOT}/index.ts`)!
    expect(rootBarrel.exports.map((e) => e.path)).toStrictEqual(expect.arrayContaining(['./pets/index.ts', './users/index.ts']))
  })

  it('generates per-subdirectory barrels when recursive is true', () => {
    const files = [makeFile(`${ROOT}/pets/listPets.ts`), makeFile(`${ROOT}/users/getUser.ts`)]
    const barrels = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, files), barrelType: 'all', recursive: true })]

    expect(barrels.map((b) => b.path)).toStrictEqual(expect.arrayContaining([`${ROOT}/index.ts`, `${ROOT}/pets/index.ts`, `${ROOT}/users/index.ts`]))
  })

  it('derives a subtree barrel from a shared index via targetPath', () => {
    const files = [makeFile(`${ROOT}/pets/listPets.ts`, ['listPets']), makeFile(`${ROOT}/users/getUser.ts`, ['getUser'])]
    const index = buildBarrelIndex(ROOT, files)
    const barrels = [...getBarrelFiles({ index, targetPath: `${ROOT}/pets`, barrelType: 'named' })]

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.path).toBe(`${ROOT}/pets/index.ts`)
    expect(barrels[0]!.exports[0]?.name).toStrictEqual(['listPets'])
  })
})

describe('getPluginOutputPrefix', () => {
  it('returns a POSIX path ending with a trailing slash', () => {
    const plugin = createMockedPlugin({ name: 'plugin-ts', options: { output: { path: 'types' } } })
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

describe('buildTree', () => {
  it('returns an empty root when no files are provided', () => {
    const tree = buildTree('/src/gen/types', [])

    expect(tree.path).toBe('/src/gen/types')
    expect(tree.isFile).toBe(false)
    expect(tree.children).toStrictEqual([])
  })

  it('creates a direct child for a file at root level', () => {
    const tree = buildTree('/src/gen/types', ['/src/gen/types/pet.ts'])

    expect(tree.children).toHaveLength(1)
    expect(tree.children[0]?.path).toBe('/src/gen/types/pet.ts')
    expect(tree.children[0]?.isFile).toBe(true)
  })

  it('creates nested children for files in subdirectories', () => {
    const tree = buildTree('/src/gen/types', ['/src/gen/types/pets/listPets.ts'])

    expect(tree.children).toHaveLength(1)
    const dir = tree.children[0]!

    expect(dir.path).toBe('/src/gen/types/pets')
    expect(dir.isFile).toBe(false)
    expect(dir.children).toHaveLength(1)
    expect(dir.children[0]?.path).toBe('/src/gen/types/pets/listPets.ts')
    expect(dir.children[0]?.isFile).toBe(true)
  })

  it('groups files in the same subdirectory under one parent node', () => {
    const tree = buildTree('/src/gen', ['/src/gen/pets/listPets.ts', '/src/gen/pets/createPet.ts'])

    expect(tree.children).toHaveLength(1)

    const dir = tree.children[0]!

    expect(dir.path).toBe('/src/gen/pets')
    expect(dir.children).toHaveLength(2)
  })

  it('handles multiple root-level files', () => {
    const tree = buildTree('/src/gen/types', ['/src/gen/types/pet.ts', '/src/gen/types/user.ts'])

    expect(tree.children).toHaveLength(2)
    expect(tree.children.every((c) => c.isFile)).toBe(true)
  })

  it('ignores files outside the root path', () => {
    const tree = buildTree('/src/gen/types', ['/src/gen/other/pet.ts', '/src/gen/types/user.ts'])

    expect(tree.children).toHaveLength(1)
    expect(tree.children[0]?.path).toBe('/src/gen/types/user.ts')
  })

  it('ignores a path that equals the root', () => {
    const tree = buildTree('/src/gen/types', ['/src/gen/types'])

    expect(tree.children).toHaveLength(0)
  })

  it('handles mixed depths correctly', () => {
    const tree = buildTree('/src/gen', ['/src/gen/pet.ts', '/src/gen/pets/listPets.ts', '/src/gen/pets/tags/getTag.ts'])

    // root has pet.ts and pets/ dir
    expect(tree.children).toHaveLength(2)

    const petFile = tree.children.find((c) => c.isFile)!
    expect(petFile.path).toBe('/src/gen/pet.ts')

    const petsDir = tree.children.find((c) => !c.isFile)!
    expect(petsDir.children).toHaveLength(2) // listPets.ts + tags/
  })
})
