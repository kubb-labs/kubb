import { describe, expect, it } from 'vitest'
import { createConst, createText, createType } from '../nodes/code.ts'
import { createExport, createFile, createImport, createSource } from '../nodes/file.ts'
import type { FileNode } from '../nodes/file.ts'
import { getNames } from './moduleNames.ts'
import { resolveSpaces } from './resolveSpaces.ts'

const pet = createFile({
  baseName: 'pet.ts',
  path: '/src/models/pet.ts',
  sources: [
    createSource({ name: 'Pet', export: true, nodes: [createType({ name: 'Pet', export: true })] }),
    createSource({ name: 'petSchema', export: true, nodes: [createConst({ name: 'petSchema', export: true })] }),
    // An `asConst` enum declares the same name twice.
    createSource({ name: 'PetStatus', export: true, nodes: [createConst({ name: 'PetStatus', export: true })] }),
    createSource({ name: 'PetStatus', export: true, isTypeOnly: true, nodes: [createType({ name: 'PetStatus', export: true })] }),
  ],
})
const files = new Map<string, FileNode>([[pet.path, pet]])
const getFile = (path: string) => files.get(path)

describe('resolveSpaces', () => {
  it('takes the space of the declaration each import name points to', () => {
    const file = createFile({
      baseName: 'getPet.ts',
      path: '/src/clients/getPet.ts',
      sources: [createSource({ nodes: [createText('const a: Pet = petSchema.parse(PetStatus)')] })],
      imports: [createImport({ names: [{ name: 'Pet' }, { name: 'petSchema' }, { name: 'PetStatus' }], root: '/src/clients/getPet.ts', path: pet.path })],
    })

    const { file: resolved, unresolved } = resolveSpaces(file, getFile)

    expect(unresolved).toStrictEqual([])
    expect(resolved.imports.flatMap(getNames)).toStrictEqual([
      { name: 'Pet', space: 'type' },
      { name: 'petSchema', space: 'value' },
      { name: 'PetStatus', space: 'value' },
    ])
  })

  it.each([
    [
      'an import',
      createFile({
        baseName: 'getPet.ts',
        path: '/src/clients/getPet.ts',
        sources: [createSource({ nodes: [createText('let a: Pet')] })],
        imports: [createImport({ names: [{ name: 'Pet' }], root: '/src/clients/getPet.ts', path: '../models/pet' })],
      }),
    ],
    ['an export', createFile({ baseName: 'index.ts', path: '/src/models/index.ts', exports: [createExport({ names: [{ name: 'Pet' }], path: './pet' })] })],
  ])('resolves the relative path of %s without its extension', (_label, file) => {
    const { file: resolved } = resolveSpaces(file, getFile)

    expect([...resolved.imports, ...resolved.exports].flatMap(getNames)).toStrictEqual([{ name: 'Pet', space: 'type' }])
  })

  it('prints a name it cannot find as a value and lists it', () => {
    const file = createFile({
      baseName: 'hook.ts',
      path: '/src/hook.ts',
      sources: [createSource({ nodes: [createText('let client: QueryClient')] })],
      imports: [createImport({ names: [{ name: 'QueryClient' }], path: '@tanstack/react-query' })],
    })

    const { file: resolved, unresolved } = resolveSpaces(file, getFile)

    expect(unresolved).toStrictEqual(['QueryClient from @tanstack/react-query'])
    expect(resolved.imports.flatMap(getNames)).toStrictEqual([{ name: 'QueryClient', space: 'value' }])
  })

  it('returns the same file when every name has a space', () => {
    const file = createFile({
      baseName: 'a.ts',
      path: '/src/a.ts',
      imports: [createImport({ name: ['Pet'], path: pet.path, root: '/src/a.ts', isTypeOnly: true })],
    })

    expect(resolveSpaces(file, getFile).file).toBe(file)
  })
})
