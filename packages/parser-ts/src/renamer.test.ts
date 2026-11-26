import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { idOf } from './definitions.ts'
import { createFileRenamer } from './renamer.ts'

const { createFile, createImport, createSource } = ast.factory

describe('createFileRenamer', () => {
  const file = createFile({
    baseName: 'pet.ts',
    path: '/gen/clients/pet.ts',
    imports: [createImport({ name: ['Options'], path: '@kubb/client' })],
    sources: [createSource({ name: 'getPet', nodes: [] })],
  })

  it('lets a carried import of a name the file already imports from the same module keep it', () => {
    expect(createFileRenamer(file).assign({ name: 'Options', owner: idOf({ path: '@kubb/client', name: 'Options' }) })).toBe('Options')
  })

  it('numbers a name the file imports from another module', () => {
    expect(createFileRenamer(file).assign({ name: 'Options', owner: idOf({ path: '/gen/models/Options.ts', name: 'Options' }) })).toBe('Options2')
  })

  it('numbers a name the file declares', () => {
    expect(createFileRenamer(file).assign({ name: 'getPet', owner: idOf({ path: '/gen/models/pet.ts', name: 'getPet' }) })).toBe('getPet2')
  })
})
