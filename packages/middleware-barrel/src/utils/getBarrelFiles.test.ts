import { createFile, createSource, createText } from '@kubb/ast'
import type { FileNode } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { getBarrelFiles } from './getBarrelFiles.ts'

function makeFile(path: string, sources: FileNode['sources'] = []): FileNode {
  return createFile({
    path,
    baseName: path.split('/').pop() as `${string}.${string}`,
    sources,
    imports: [],
    exports: [],
  })
}

function makeIndexableSource(name: string, isTypeOnly = false) {
  return createSource({ name, isIndexable: true, isTypeOnly, nodes: [createText(`export ${isTypeOnly ? 'type ' : ''}const ${name} = null`)] })
}

function makeNonIndexableSource(name: string) {
  return createSource({ name, isIndexable: false, nodes: [createText(`const ${name} = null`)] })
}

const ROOT = '/src/gen/types'

describe('getBarrelFiles', () => {
  describe("strategy: 'all'", () => {
    it('generates a single barrel with export * for each file', () => {
      const files = [makeFile(`${ROOT}/pet.ts`), makeFile(`${ROOT}/user.ts`)]
      const barrels = getBarrelFiles(ROOT, files, 'all')

      expect(barrels).toHaveLength(1)
      const barrel = barrels[0]!
      expect(barrel.path).toBe(`${ROOT}/index.ts`)
      expect(barrel.exports).toHaveLength(2)
      expect(barrel.exports.map((e) => e.path)).toEqual(expect.arrayContaining(['./pet.ts', './user.ts']))
    })

    it('includes files in subdirectories with their relative path', () => {
      const files = [makeFile(`${ROOT}/pets/listPets.ts`)]
      const barrels = getBarrelFiles(ROOT, files, 'all')

      expect(barrels).toHaveLength(1)
      expect(barrels[0]!.exports[0]?.path).toBe('./pets/listPets.ts')
    })

    it('skips files where all sources have isIndexable: false', () => {
      const files = [makeFile(`${ROOT}/pet.ts`, [makeNonIndexableSource('Pet')])]
      const barrels = getBarrelFiles(ROOT, files, 'all')

      expect(barrels).toHaveLength(0)
    })

    it('excludes existing barrel files from being re-exported', () => {
      const files = [makeFile(`${ROOT}/index.ts`), makeFile(`${ROOT}/pet.ts`)]
      const barrels = getBarrelFiles(ROOT, files, 'all')

      expect(barrels).toHaveLength(1)
      expect(barrels[0]!.exports.every((e) => !e.path.endsWith('index.ts'))).toBe(true)
    })

    it('returns empty when no files are inside outputPath', () => {
      const files = [makeFile('/src/gen/schemas/petSchema.ts')]
      const barrels = getBarrelFiles(ROOT, files, 'all')

      expect(barrels).toHaveLength(0)
    })

    it('excludes non-source-extension files', () => {
      const files = [makeFile(`${ROOT}/pet.json`), makeFile(`${ROOT}/pet.ts`)]
      const barrels = getBarrelFiles(ROOT, files, 'all')

      expect(barrels).toHaveLength(1)
      expect(barrels[0]!.exports).toHaveLength(1)
      expect(barrels[0]!.exports[0]?.path).toBe('./pet.ts')
    })
  })

  describe("strategy: 'named'", () => {
    it('generates named exports for indexable sources', () => {
      const files = [makeFile(`${ROOT}/pet.ts`, [makeIndexableSource('Pet'), makeIndexableSource('PetSchema')])]
      const barrels = getBarrelFiles(ROOT, files, 'named')

      expect(barrels).toHaveLength(1)
      const barrel = barrels[0]!
      const valueExport = barrel.exports.find((e) => !e.isTypeOnly)
      expect(valueExport?.name).toEqual(expect.arrayContaining(['Pet', 'PetSchema']))
    })

    it('separates type-only and value exports', () => {
      const files = [makeFile(`${ROOT}/pet.ts`, [makeIndexableSource('Pet', true), makeIndexableSource('createPet', false)])]
      const barrels = getBarrelFiles(ROOT, files, 'named')

      expect(barrels).toHaveLength(1)
      const barrel = barrels[0]!
      const typeExport = barrel.exports.find((e) => e.isTypeOnly)
      const valueExport = barrel.exports.find((e) => !e.isTypeOnly)
      expect(typeExport?.name).toContain('Pet')
      expect(valueExport?.name).toContain('createPet')
    })

    it('falls back to wildcard when there are no sources at all', () => {
      const files = [makeFile(`${ROOT}/pet.ts`)]
      const barrels = getBarrelFiles(ROOT, files, 'named')

      expect(barrels).toHaveLength(1)
      expect(barrels[0]!.exports[0]?.name).toBeUndefined() // wildcard has no name
    })

    it('skips file entirely when all sources are non-indexable', () => {
      const files = [makeFile(`${ROOT}/pet.ts`, [makeNonIndexableSource('Pet')])]
      const barrels = getBarrelFiles(ROOT, files, 'named')

      expect(barrels).toHaveLength(0)
    })

    it('skips file when none of the sources have a name', () => {
      const files = [
        makeFile(`${ROOT}/pet.ts`, [createSource({ isIndexable: true, nodes: [createText('export const x = 1')] })]),
      ]
      const barrels = getBarrelFiles(ROOT, files, 'named')

      // unnamed indexable sources produce zero named exports → falls back like empty-sources case
      expect(barrels).toHaveLength(0)
    })
  })

  describe("strategy: 'propagate'", () => {
    it('generates leaf barrel for files at root level', () => {
      const files = [makeFile(`${ROOT}/pet.ts`)]
      const barrels = getBarrelFiles(ROOT, files, 'propagate')

      expect(barrels).toHaveLength(1)
      expect(barrels[0]!.path).toBe(`${ROOT}/index.ts`)
      expect(barrels[0]!.exports[0]?.path).toBe('./pet.ts')
    })

    it('generates intermediate and root barrels for nested files', () => {
      const files = [makeFile(`${ROOT}/pets/listPets.ts`), makeFile(`${ROOT}/users/getUser.ts`)]
      const barrels = getBarrelFiles(ROOT, files, 'propagate')

      // root barrel + pets/ barrel + users/ barrel
      expect(barrels).toHaveLength(3)

      const rootBarrel = barrels.find((b) => b.path === `${ROOT}/index.ts`)!
      expect(rootBarrel).toBeDefined()
      // root exports sub-directory barrels, not individual files
      expect(rootBarrel.exports.map((e) => e.path)).toEqual(
        expect.arrayContaining(['./pets/index.ts', './users/index.ts']),
      )

      const petsBarrel = barrels.find((b) => b.path === `${ROOT}/pets/index.ts`)!
      expect(petsBarrel).toBeDefined()
      expect(petsBarrel.exports[0]?.path).toBe('./listPets.ts')
    })

    it('returns empty when there are no files', () => {
      const barrels = getBarrelFiles(ROOT, [], 'propagate')
      expect(barrels).toHaveLength(0)
    })
  })
})
