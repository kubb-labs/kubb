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
    it('generates wildcard exports for each file', () => {
      const files = [makeFile(`${ROOT}/pet.ts`), makeFile(`${ROOT}/user.ts`)]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'all' })

      expect(barrels).toHaveLength(1)
      expect(barrels[0]!.path).toBe(`${ROOT}/index.ts`)
      expect(barrels[0]!.exports.map((e) => e.path)).toEqual(expect.arrayContaining(['./pet.ts', './user.ts']))
    })

    it('references nested files with their relative path from the root', () => {
      const files = [makeFile(`${ROOT}/pets/listPets.ts`)]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'all' })

      expect(barrels[0]!.exports[0]?.path).toBe('./pets/listPets.ts')
    })

    it('skips files where all sources are non-indexable', () => {
      const files = [makeFile(`${ROOT}/pet.ts`, [makeNonIndexableSource('Pet')])]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'all' })

      expect(barrels).toHaveLength(0)
    })

    it('excludes existing barrel files and non-source extensions', () => {
      const files = [makeFile(`${ROOT}/index.ts`), makeFile(`${ROOT}/pet.json`), makeFile(`${ROOT}/pet.ts`)]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'all' })

      expect(barrels[0]!.exports).toHaveLength(1)
      expect(barrels[0]!.exports[0]?.path).toBe('./pet.ts')
    })

    it('returns empty when no files are inside outputPath', () => {
      const files = [makeFile('/src/gen/schemas/petSchema.ts')]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'all' })

      expect(barrels).toHaveLength(0)
    })

    it('generates a barrel per subdirectory when recursive', () => {
      const files = [makeFile(`${ROOT}/petController/useAddPet.ts`), makeFile(`${ROOT}/userController/useGetUser.ts`)]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'all', recursive: true })

      expect(barrels.map((b) => b.path)).toEqual(
        expect.arrayContaining([`${ROOT}/index.ts`, `${ROOT}/petController/index.ts`, `${ROOT}/userController/index.ts`]),
      )
      expect(barrels.find((b) => b.path === `${ROOT}/petController/index.ts`)!.exports[0]?.path).toBe('./useAddPet.ts')
    })
  })

  describe("strategy: 'named'", () => {
    it('separates value and type-only named exports per file', () => {
      const files = [makeFile(`${ROOT}/pet.ts`, [makeIndexableSource('Pet', true), makeIndexableSource('createPet', false)])]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'named' })

      expect(barrels).toHaveLength(1)
      expect(barrels[0]!.exports.find((e) => e.isTypeOnly)?.name).toContain('Pet')
      expect(barrels[0]!.exports.find((e) => !e.isTypeOnly)?.name).toContain('createPet')
    })

    it('falls back to wildcard when a file has no sources', () => {
      const files = [makeFile(`${ROOT}/pet.ts`)]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'named' })

      expect(barrels[0]!.exports[0]?.name).toBeUndefined()
    })

    it('skips files where all sources are non-indexable or unnamed', () => {
      const files = [
        makeFile(`${ROOT}/pet.ts`, [makeNonIndexableSource('Pet')]),
        makeFile(`${ROOT}/user.ts`, [createSource({ isIndexable: true, nodes: [createText('export const x = 1')] })]),
      ]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'named' })

      expect(barrels).toHaveLength(0)
    })

    it('generates a barrel per subdirectory when recursive, with correct relative paths', () => {
      const files = [
        makeFile(`${ROOT}/petController/useAddPet.ts`, [makeIndexableSource('useAddPet')]),
        makeFile(`${ROOT}/userController/useGetUser.ts`, [makeIndexableSource('useGetUser', true)]),
      ]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'named', recursive: true })

      expect(barrels.map((b) => b.path)).toEqual(
        expect.arrayContaining([`${ROOT}/index.ts`, `${ROOT}/petController/index.ts`, `${ROOT}/userController/index.ts`]),
      )
      // root barrel references files via their full relative path
      expect(barrels.find((b) => b.path === `${ROOT}/index.ts`)!.exports.map((e) => e.path)).toContain('./petController/useAddPet.ts')
      // subdirectory barrel references files relative to itself
      expect(barrels.find((b) => b.path === `${ROOT}/petController/index.ts`)!.exports[0]?.path).toBe('./useAddPet.ts')
      // type-only exports are preserved in subdirectory barrels
      expect(barrels.find((b) => b.path === `${ROOT}/userController/index.ts`)!.exports[0]?.isTypeOnly).toBe(true)
    })

    it('does not generate subdirectory barrels by default', () => {
      const files = [makeFile(`${ROOT}/petController/useAddPet.ts`, [makeIndexableSource('useAddPet')])]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'named' })

      expect(barrels).toHaveLength(1)
      expect(barrels[0]!.path).toBe(`${ROOT}/index.ts`)
    })
  })

  describe("strategy: 'propagate'", () => {
    it('generates intermediate barrels for each subdirectory, root exports sub-index files', () => {
      const files = [makeFile(`${ROOT}/pets/listPets.ts`), makeFile(`${ROOT}/users/getUser.ts`)]
      const barrels = getBarrelFiles({ outputPath: ROOT, files, barrelType: 'propagate' })

      expect(barrels).toHaveLength(3)
      expect(barrels.find((b) => b.path === `${ROOT}/index.ts`)!.exports.map((e) => e.path)).toEqual(
        expect.arrayContaining(['./pets/index.ts', './users/index.ts']),
      )
      expect(barrels.find((b) => b.path === `${ROOT}/pets/index.ts`)!.exports[0]?.path).toBe('./listPets.ts')
    })

    it('returns empty when there are no files', () => {
      const barrels = getBarrelFiles({ outputPath: ROOT, files: [], barrelType: 'propagate' })
      expect(barrels).toHaveLength(0)
    })
  })
})
