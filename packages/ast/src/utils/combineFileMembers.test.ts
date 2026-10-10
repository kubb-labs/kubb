import { describe, expect, it } from 'vitest'
import { createText } from '../nodes/code.ts'
import { createExport, createImport, createSource } from '../nodes/file.ts'
import { combineExports, combineImports, combineSources } from './combineFileMembers.ts'

describe('combineSources', () => {
  it('deduplicates sources with the same name', () => {
    const src = createSource({
      name: 'Pet',
      nodes: [createText('export type Pet = {}')],
    })
    const result = combineSources([src, src])

    expect(result).toHaveLength(1)
  })

  it('keeps sources with different names', () => {
    const a = createSource({
      name: 'Pet',
      nodes: [createText('export type Pet = {}')],
    })
    const b = createSource({
      name: 'Order',
      nodes: [createText('export type Order = {}')],
    })
    const result = combineSources([a, b])

    expect(result).toHaveLength(2)
  })

  it('deduplicates by reference when name is absent', () => {
    const src = createSource({ nodes: [createText('const x = 1')] })
    const result = combineSources([src, src])

    expect(result).toHaveLength(1)
  })

  it('treats sources with the same name but different isExportable as distinct', () => {
    const a = createSource({
      name: 'Pet',
      nodes: [createText('export type Pet = {}')],
      isExportable: true,
    })
    const b = createSource({
      name: 'Pet',
      nodes: [createText('export type Pet = {}')],
      isExportable: false,
    })
    const result = combineSources([a, b])

    expect(result).toHaveLength(2)
  })

  it('treats sources with the same name but different isTypeOnly as distinct', () => {
    const a = createSource({
      name: 'Pet',
      nodes: [createText('export type Pet = {}')],
      isTypeOnly: true,
    })
    const b = createSource({
      name: 'Pet',
      nodes: [createText('export type Pet = {}')],
      isTypeOnly: false,
    })
    const result = combineSources([a, b])

    expect(result).toHaveLength(2)
  })

  it('preserves insertion order for unique sources', () => {
    const a = createSource({ name: 'Z', nodes: [createText('z')] })
    const b = createSource({ name: 'A', nodes: [createText('a')] })
    const result = combineSources([a, b])

    expect(result[0]!.name).toBe('Z')
    expect(result[1]!.name).toBe('A')
  })
})

describe('combineExports', () => {
  it('returns one export per path with the names merged, deduplicated and sorted', () => {
    const pet = createExport({ name: ['Pet'], path: './models' })
    const order = createExport({ name: ['Order'], path: './models' })
    const result = combineExports([pet, pet, order])

    expect(result).toStrictEqual([{ kind: 'Export', name: ['Order', 'Pet'], path: './models' }])
  })

  it('keeps type-only and value exports from the same path separate', () => {
    const value = createExport({
      name: ['Pet'],
      path: './Pet',
      isTypeOnly: false,
    })
    const typeOnly = createExport({
      name: ['Pet'],
      path: './Pet',
      isTypeOnly: true,
    })
    const result = combineExports([value, typeOnly])

    expect(result).toHaveLength(2)
  })

  it('returns wildcard exports before named ones, type-only first, then sorted by path', () => {
    const named = createExport({ name: ['Pet'], path: './Pet' })
    const c = createExport({ path: './c' })
    const a = createExport({ path: './a' })
    const typeOnly = createExport({ path: './b', isTypeOnly: true })
    const result = combineExports([named, c, a, typeOnly])

    expect(result.map((e) => e.path)).toStrictEqual(['./b', './a', './c', './Pet'])
  })

  it('deduplicates namespace alias exports', () => {
    const exp = createExport({ name: 'utils', path: './utils', asAlias: true })
    const result = combineExports([exp, exp])

    expect(result).toHaveLength(1)
  })

  it('drops empty-array named exports', () => {
    const exp = createExport({ name: [], path: './empty' })
    const result = combineExports([exp])

    expect(result).toHaveLength(0)
  })
})

describe('combineImports', () => {
  it.each([
    { label: 'a named import', imp: createImport({ name: ['z'], path: 'zod' }) },
    { label: 'a namespace import', imp: createImport({ name: 'z', path: 'zod' }) },
    { label: 'an aliased named import', imp: createImport({ name: [{ propertyName: 'zod', name: 'z' }], path: 'zod' }) },
  ])('keeps $label when its local name appears in the source', ({ imp }) => {
    expect(combineImports([imp], [], 'const schema = z.string()')).toStrictEqual([imp])
  })

  it.each([
    { label: 'a named import', imp: createImport({ name: ['unused'], path: 'lodash' }) },
    { label: 'a namespace import', imp: createImport({ name: 'unused', path: 'lodash' }) },
    { label: 'an aliased named import', imp: createImport({ name: [{ propertyName: 'fakerDE', name: 'faker' }], path: '@faker-js/faker' }) },
  ])('filters out $label when its name does not appear in the source', ({ imp }) => {
    expect(combineImports([imp], [], 'const x = 1')).toStrictEqual([])
  })

  it('retains imports that are re-exported', () => {
    const imp = createImport({ name: ['Pet'], path: './Pet' })
    const exp = createExport({ name: ['Pet'], path: './Pet' })
    const result = combineImports([imp], [exp], '')

    expect(result).toHaveLength(1)
  })

  it('returns one import per path with the names merged, deduplicated and sorted', () => {
    const pet = createImport({ name: ['Pet'], path: './models' })
    const order = createImport({ name: ['Order'], path: './models' })
    const aliased = createImport({ name: [{ propertyName: 'fakerDE', name: 'faker' }], path: '@faker-js/faker' })
    const result = combineImports([pet, pet, order, aliased, aliased], [], 'Pet Order faker')

    expect(result).toStrictEqual([
      { kind: 'Import', name: ['Order', 'Pet'], path: './models' },
      { kind: 'Import', name: [{ propertyName: 'fakerDE', name: 'faker' }], path: '@faker-js/faker' },
    ])
  })

  it('keeps value and type-only imports from the same path separate', () => {
    const value = createImport({
      name: ['Pet'],
      path: './models',
      isTypeOnly: false,
    })
    const typeOnly = createImport({
      name: ['Pet'],
      path: './models',
      isTypeOnly: true,
    })
    const result = combineImports([value, typeOnly], [], 'Pet')

    expect(result).toHaveLength(2)
  })

  it('returns namespace imports before named ones, then sorted by path', () => {
    const c = createImport({ name: ['c'], path: './c' })
    const a = createImport({ name: ['a'], path: './a' })
    const b = createImport({ name: ['b'], path: './b' })
    const ns = createImport({ name: 'z', path: 'zod' })
    const result = combineImports([c, a, ns, b], [], 'a b c z')

    expect(result.map((i) => i.path)).toStrictEqual(['zod', './a', './b', './c'])
  })

  it('skips an import when path equals root', () => {
    const imp = createImport({
      name: ['self'],
      path: 'src/pet.ts',
      root: 'src/pet.ts',
    })
    const result = combineImports([imp], [], 'self')

    expect(result).toHaveLength(0)
  })

  it('keeps a default import when a used named import from the same path is retained', () => {
    const client = createImport({ name: 'client', path: '@kubb/plugin-axios/clients/axios' })
    const types = createImport({ name: ['Client', 'RequestConfig'], path: '@kubb/plugin-axios/clients/axios', isTypeOnly: true })
    // The merged grouped source omits the function body, so `client` is absent — but `Client` is referenced.
    const result = combineImports([client, types], [], 'Partial<RequestConfig> & { client?: Client }')

    expect(result.some((i) => i.name === 'client')).toBe(true)
    expect(result.some((i) => Array.isArray(i.name) && i.name.includes('Client'))).toBe(true)
  })

  it('still drops a default import when no named import from the same path is used', () => {
    const client = createImport({ name: 'client', path: '@kubb/plugin-axios/clients/axios' })
    const types = createImport({ name: ['Client'], path: '@kubb/plugin-axios/clients/axios', isTypeOnly: true })
    const result = combineImports([client, types], [], 'const x = 1')

    expect(result).toHaveLength(0)
  })

  // Over 128 imports, so these run the identifier index rather than a scan per name. Names are
  // zero-padded so no name is a substring of another, which substring matching would keep.
  const indexedImports = () =>
    Array.from({ length: 200 }, (_, index) => {
      const name = `Model${String(index).padStart(3, '0')}`
      return createImport({ name: [name], path: `./${name}.ts` })
    })

  it('keeps the names the source uses and drops the rest once it is indexed', () => {
    const result = combineImports(indexedImports(), [], 'export type Used = Model000 | Model199')

    expect(result.map((node) => node.path)).toStrictEqual(['./Model000.ts', './Model199.ts'])
  })

  it('keeps an indexed name that only occurs inside a longer identifier', () => {
    const result = combineImports(indexedImports(), [], 'export type Used = Model000Extended')

    expect(result.map((node) => node.path)).toStrictEqual(['./Model000.ts'])
  })
})
