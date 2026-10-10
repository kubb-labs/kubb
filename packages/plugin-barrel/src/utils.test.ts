import { ast } from '@kubb/kit'
import { Diagnostics } from '@kubb/core'
import type { Diagnostic } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { buildBarrelIndex, getBarrelFiles } from './utils.ts'
import type { BarrelType } from './types.ts'

function makeFile(filePath: string, names: Array<string> = [], isTypeOnly = false) {
  return ast.factory.createFile({
    path: filePath,
    baseName: filePath.split('/').pop() as `${string}.${string}`,
    sources: names.map((name) =>
      ast.factory.createSource({ name, isIndexable: true, isTypeOnly, nodes: [ast.factory.createText(`export const ${name} = null`)] }),
    ),
    imports: [],
    exports: [],
  })
}

const ROOT = '/workspace/src/gen/types'

type CollisionRow = { scenario: string; barrelType: BarrelType; files: Array<ast.FileNode>; exportCount: number }

describe('getBarrelFiles', () => {
  it('returns an empty array when there are no files under outputPath', () => {
    const result = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, []), barrelType: 'all' })]
    expect(result).toHaveLength(0)
  })

  it('returns one wildcard barrel for flat files and skips files outside the root', () => {
    const files = [makeFile(`${ROOT}/user.ts`), makeFile(`${ROOT}/pet.ts`), makeFile('/workspace/src/gen/other/pet.ts')]
    const barrels = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, files), barrelType: 'all' })]

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.path).toBe(`${ROOT}/index.ts`)
    expect(barrels[0]!.exports.map((e) => e.path)).toStrictEqual(['./pet.ts', './user.ts'])
  })

  it('returns named exports when barrelType is named', () => {
    const files = [makeFile(`${ROOT}/pet.ts`, ['Pet', 'createPet'])]
    const barrels = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, files), barrelType: 'named' })]

    expect(barrels).toHaveLength(1)
    expect(barrels[0]!.exports[0]?.name).toStrictEqual(['Pet', 'createPet'])
  })

  const collisions: Array<CollisionRow> = [
    { scenario: 'two named value exports', barrelType: 'named', files: [makeFile(`${ROOT}/a.ts`, ['Pet']), makeFile(`${ROOT}/b.ts`, ['Pet'])], exportCount: 1 },
    {
      scenario: 'a value and a type export',
      barrelType: 'named',
      files: [makeFile(`${ROOT}/value.ts`, ['Pet']), makeFile(`${ROOT}/type.ts`, ['Pet'], true)],
      exportCount: 1,
    },
    { scenario: 'two wildcard exports', barrelType: 'all', files: [makeFile(`${ROOT}/a.ts`, ['Pet']), makeFile(`${ROOT}/b.ts`, ['Pet'])], exportCount: 2 },
  ]

  it.each(collisions)('reports a duplicate export and keeps the first one when $scenario share a name', ({ barrelType, files, exportCount }) => {
    const diagnostics: Array<Diagnostic> = []
    const barrels = Diagnostics.scope(
      (diagnostic) => diagnostics.push(diagnostic),
      () => [...getBarrelFiles({ index: buildBarrelIndex(ROOT, files), barrelType })],
    )

    expect(barrels[0]?.exports).toHaveLength(exportCount)
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

  it('returns a hierarchical barrel per directory with named leaf exports when nested is true', () => {
    const files = [makeFile(`${ROOT}/pets/listPets.ts`, ['listPets']), makeFile(`${ROOT}/users/getUser.ts`, ['getUser'])]
    const barrels = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, files), barrelType: 'named', nested: true })]

    expect(barrels.map((b) => b.path).sort()).toStrictEqual([`${ROOT}/index.ts`, `${ROOT}/pets/index.ts`, `${ROOT}/users/index.ts`])

    const petsBarrel = barrels.find((b) => b.path === `${ROOT}/pets/index.ts`)!
    expect(petsBarrel.exports[0]?.name).toStrictEqual(['listPets'])

    const rootBarrel = barrels.find((b) => b.path === `${ROOT}/index.ts`)!
    expect(rootBarrel.exports.map((e) => e.path)).toStrictEqual(['./pets/index.ts', './users/index.ts'])
  })

  it('returns a barrel per subdirectory grouping its files when recursive is true', () => {
    const files = [makeFile(`${ROOT}/pets/listPets.ts`), makeFile(`${ROOT}/pets/createPet.ts`), makeFile(`${ROOT}/users/getUser.ts`)]
    const barrels = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, files), barrelType: 'all', recursive: true })]

    expect(barrels.map((b) => b.path).sort()).toStrictEqual([`${ROOT}/index.ts`, `${ROOT}/pets/index.ts`, `${ROOT}/users/index.ts`])

    const petsBarrel = barrels.find((b) => b.path === `${ROOT}/pets/index.ts`)!
    expect(petsBarrel.exports.map((e) => e.path)).toStrictEqual(['./createPet.ts', './listPets.ts'])
  })

  it('returns a barrel per level linking root files and nested directories when depths are mixed', () => {
    const files = [makeFile(`${ROOT}/pet.ts`), makeFile(`${ROOT}/pets/listPets.ts`), makeFile(`${ROOT}/pets/tags/getTag.ts`)]
    const barrels = [...getBarrelFiles({ index: buildBarrelIndex(ROOT, files), barrelType: 'all', nested: true })]

    expect(barrels.map((b) => b.path).sort()).toStrictEqual([`${ROOT}/index.ts`, `${ROOT}/pets/index.ts`, `${ROOT}/pets/tags/index.ts`])

    const rootBarrel = barrels.find((b) => b.path === `${ROOT}/index.ts`)!
    expect(rootBarrel.exports.map((e) => e.path)).toStrictEqual(['./pet.ts', './pets/index.ts'])

    const petsBarrel = barrels.find((b) => b.path === `${ROOT}/pets/index.ts`)!
    expect(petsBarrel.exports.map((e) => e.path)).toStrictEqual(['./listPets.ts', './tags/index.ts'])

    const tagsBarrel = barrels.find((b) => b.path === `${ROOT}/pets/tags/index.ts`)!
    expect(tagsBarrel.exports.map((e) => e.path)).toStrictEqual(['./getTag.ts'])
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
