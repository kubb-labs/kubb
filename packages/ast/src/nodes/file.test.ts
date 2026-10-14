import { describe, expect, it } from 'vitest'
import { createText } from './code.ts'
import { createFile, createImport, createSource } from './file.ts'

describe('createFile', () => {
  it('creates a FileNode with correct kind, id, name and extname', () => {
    const file = createFile({
      baseName: 'petStore.ts',
      path: 'src/models/petStore.ts',
    })

    expect(file.kind).toBe('File')
    expect(file.name).toBe('petStore')
    expect(file.extname).toBe('.ts')
    expect(typeof file.id).toBe('string')
    expect(file.id.length).toBeGreaterThan(0)
  })

  it('throws when baseName has no extension', () => {
    expect(() =>
      createFile({
        baseName: 'petStore' as `.${string}`,
        path: 'src/petStore',
      }),
    ).toThrow(/No extname found/)
  })

  it('filters unused imports', () => {
    const usedImport = createImport({ name: ['z'], path: 'zod' })
    const unusedImport = createImport({ name: ['unused'], path: 'lodash' })
    const src = createSource({
      nodes: [createText('const schema = z.string()')],
    })
    const file = createFile({
      baseName: 'schema.ts',
      path: 'src/schema.ts',
      sources: [src],
      imports: [usedImport, unusedImport],
    })

    expect(file.imports.map((i) => i.path)).toContain('zod')
    expect(file.imports.map((i) => i.path)).not.toContain('lodash')
  })

  it('drops imports that resolve to the containing file (self-imports)', () => {
    const selfImport = createImport({ name: ['Pet'], path: 'src/pets.ts' })
    const crossFileImport = createImport({ name: ['Order'], path: 'src/orders.ts' })
    const bareImport = createImport({ name: ['z'], path: 'zod' })
    const src = createSource({
      nodes: [createText('const value: Pet & Order = z.parse()')],
    })
    const file = createFile({
      baseName: 'pets.ts',
      path: 'src/pets.ts',
      sources: [src],
      imports: [selfImport, crossFileImport, bareImport],
    })

    const paths = file.imports.map((i) => i.path)
    expect(paths).not.toContain('src/pets.ts')
    expect(paths).toContain('src/orders.ts')
    expect(paths).toContain('zod')
  })

  it('drops imports of locally defined names even when the path differs and keeps the non-local names of a grouped import', () => {
    // When output is consolidated the file can live at one path while the import for `Pet`
    // resolves to the per-schema path, so the strings differ and the path filter cannot match.
    const selfNamedImport = createImport({ name: ['Pet'], path: 'src/models/Pet.ts' })
    const mixedImport = createImport({ name: ['Pet', 'Order'], path: 'src/models/Order.ts' })
    const petSource = createSource({ name: 'Pet', nodes: [createText('export type Pet = { order: Order }')], isExportable: true })
    const file = createFile({
      baseName: 'pet.ts',
      path: 'src/models/pet.ts',
      sources: [petSource],
      imports: [selfNamedImport, mixedImport],
    })

    const names = file.imports.flatMap((i) => (Array.isArray(i.name) ? i.name : [i.name]))
    expect(names).not.toContain('Pet')
    expect(names).toContain('Order')
  })
})
