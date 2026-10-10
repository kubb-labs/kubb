import { describe, expect, it } from 'vitest'
import { createText } from './code.ts'
import { createExport, createFile, createImport, createSource } from './file.ts'

const importInput = { name: ['FC'], path: 'react', isTypeOnly: true }
const exportInput = { name: ['default'], path: './Pet', isTypeOnly: true, asAlias: true }
const sourceInput = { name: 'Pet', nodes: [createText('export type Pet = {}')], isExportable: true, isTypeOnly: true }

describe('file factories', () => {
  it.each([
    { kind: 'Import', input: importInput, node: createImport(importInput) },
    { kind: 'Export', input: exportInput, node: createExport(exportInput) },
    { kind: 'Source', input: sourceInput, node: createSource(sourceInput) },
  ])('returns { kind: $kind, ...input } when creating a $kind node', ({ kind, input, node }) => {
    expect(node).toStrictEqual({ kind, ...input })
  })

  it('returns the factory kind when the input carries another kind', () => {
    const otherKindImport = { name: ['x'], path: './x', kind: 'Export' }
    const otherKindExport = { name: ['x'], path: './x', kind: 'Import' }
    const otherKindSource = { nodes: [createText('x')], kind: 'Import' }

    expect(createImport(otherKindImport).kind).toBe('Import')
    expect(createExport(otherKindExport).kind).toBe('Export')
    expect(createSource(otherKindSource).kind).toBe('Source')
  })
})

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

  it('generates a stable id from the path', () => {
    const a = createFile({ baseName: 'pet.ts', path: 'src/pet.ts' })
    const b = createFile({ baseName: 'pet.ts', path: 'src/pet.ts' })

    expect(a.id).toBe(b.id)
  })

  it('generates different ids for different paths', () => {
    const a = createFile({ baseName: 'pet.ts', path: 'src/a/pet.ts' })
    const b = createFile({ baseName: 'pet.ts', path: 'src/b/pet.ts' })

    expect(a.id).not.toBe(b.id)
  })

  it('throws when baseName has no extension', () => {
    expect(() =>
      createFile({
        baseName: 'petStore' as `.${string}`,
        path: 'src/petStore',
      }),
    ).toThrow(/No extname found/)
  })

  it('deduplicates sources', () => {
    const src = createSource({
      name: 'Pet',
      nodes: [createText('export type Pet = {}')],
    })
    const file = createFile({
      baseName: 'pet.ts',
      path: 'src/pet.ts',
      sources: [src, src],
    })

    expect(file.sources).toHaveLength(1)
  })

  it('deduplicates exports', () => {
    const exp = createExport({ name: ['Pet'], path: './Pet' })
    const file = createFile({
      baseName: 'index.ts',
      path: 'src/index.ts',
      exports: [exp, exp],
    })

    expect(file.exports).toHaveLength(1)
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

  it('drops imports of names defined locally even when the path differs', () => {
    // When output is consolidated the file can live at one path while the import for `Pet`
    // resolves to the per-schema path, so the strings differ and the path filter cannot match.
    const selfNamedImport = createImport({ name: ['Pet'], path: 'src/models/Pet.ts' })
    const crossFileImport = createImport({ name: ['Order'], path: 'src/models/Order.ts' })
    const petSource = createSource({ name: 'Pet', nodes: [createText('export type Pet = { order: Order }')], isExportable: true })
    const file = createFile({
      baseName: 'pet.ts',
      path: 'src/models/pet.ts',
      sources: [petSource],
      imports: [selfNamedImport, crossFileImport],
    })

    const names = file.imports.flatMap((i) => (Array.isArray(i.name) ? i.name : [i.name]))
    expect(names).not.toContain('Pet')
    expect(names).toContain('Order')
    expect(file.sources.some((s) => s.name === 'Pet')).toBe(true)
  })

  it('keeps non-local names when a grouped import mixes local and cross-file bindings', () => {
    const mixedImport = createImport({ name: ['Pet', 'Order'], path: 'src/models/Pet.ts' })
    const petSource = createSource({ name: 'Pet', nodes: [createText('export type Pet = { order: Order }')], isExportable: true })
    const file = createFile({
      baseName: 'pet.ts',
      path: 'src/models/pet.ts',
      sources: [petSource],
      imports: [mixedImport],
    })

    const names = file.imports.flatMap((i) => (Array.isArray(i.name) ? i.name : [i.name]))
    expect(names).not.toContain('Pet')
    expect(names).toContain('Order')
  })

  it('carries through meta, banner and footer', () => {
    const file = createFile({
      baseName: 'pet.ts',
      path: 'src/pet.ts',
      meta: { tag: 'pets' },
      banner: '// generated',
      footer: '// end',
    })

    expect(file.meta).toStrictEqual({ tag: 'pets' })
    expect(file.banner).toBe('// generated')
    expect(file.footer).toBe('// end')
  })
})
