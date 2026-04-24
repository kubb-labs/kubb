import { describe, expect, it } from 'vitest'
import { buildTree } from './buildTree.ts'

describe('buildTree', () => {
  it('returns an empty root when no files are provided', () => {
    const tree = buildTree('/src/gen/types', [])

    expect(tree.path).toBe('/src/gen/types')
    expect(tree.isFile).toBe(false)
    expect(tree.children).toEqual([])
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
