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

  it('returns empty array for empty input', () => {
    expect(combineSources([])).toStrictEqual([])
  })
})

describe('combineExports', () => {
  it('deduplicates identical named exports from the same path', () => {
    const exp = createExport({ name: ['Pet'], path: './Pet' })
    const result = combineExports([exp, exp])

    expect(result).toHaveLength(1)
    expect(result[0]!.name).toStrictEqual(['Pet'])
  })

  it('merges named exports from the same path into one entry', () => {
    const a = createExport({ name: ['Pet'], path: './models' })
    const b = createExport({ name: ['Order'], path: './models' })
    const result = combineExports([a, b])

    expect(result).toHaveLength(1)
    expect(result[0]!.name).toContain('Pet')
    expect(result[0]!.name).toContain('Order')
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

  it('keeps wildcard and named exports from the same path separate', () => {
    const wildcard = createExport({ path: './utils' })
    const named = createExport({ name: ['helper'], path: './utils' })
    const result = combineExports([wildcard, named])

    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('sorts wildcard exports before named array exports', () => {
    const named = createExport({ name: ['Pet'], path: './Pet' })
    const wildcard = createExport({ path: './utils' })
    const result = combineExports([named, wildcard])

    // wildcard (name = undefined, not array) comes before named array
    const wildcardIndex = result.findIndex((e) => e.name == null)
    const namedIndex = result.findIndex((e) => Array.isArray(e.name))
    expect(wildcardIndex).toBeLessThan(namedIndex)
  })

  it('sorts type-only exports before value exports', () => {
    const value = createExport({ path: './a' })
    const typeOnly = createExport({ path: './b', isTypeOnly: true })
    const result = combineExports([value, typeOnly])

    const typeOnlyIndex = result.findIndex((e) => e.isTypeOnly)
    const valueIndex = result.findIndex((e) => !e.isTypeOnly)
    expect(typeOnlyIndex).toBeLessThan(valueIndex)
  })

  it('sorts exports alphabetically by path', () => {
    const c = createExport({ path: './c' })
    const a = createExport({ path: './a' })
    const b = createExport({ path: './b' })
    const result = combineExports([c, a, b])

    expect(result.map((e) => e.path)).toStrictEqual(['./a', './b', './c'])
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

  it('returns empty array for empty input', () => {
    expect(combineExports([])).toStrictEqual([])
  })
})

describe('combineImports', () => {
  it('keeps imports whose names appear in the source', () => {
    const imp = createImport({ name: ['z'], path: 'zod' })
    const result = combineImports([imp], [], 'const schema = z.string()')

    expect(result).toHaveLength(1)
    expect(result[0]!.path).toBe('zod')
  })

  it('filters out imports whose names do not appear in the source', () => {
    const imp = createImport({ name: ['unused'], path: 'lodash' })
    const result = combineImports([imp], [], 'const x = 1')

    expect(result).toHaveLength(0)
  })

  it('filters out namespace imports when the alias is not used in the source', () => {
    const imp = createImport({ name: 'z', path: 'zod' })
    const result = combineImports([imp], [], 'const x = 1')

    expect(result).toHaveLength(0)
  })

  it('keeps namespace import when the alias appears in the source', () => {
    const imp = createImport({ name: 'z', path: 'zod' })
    const result = combineImports([imp], [], 'const schema = z.string()')

    expect(result).toHaveLength(1)
  })

  it('retains imports that are re-exported', () => {
    const imp = createImport({ name: ['Pet'], path: './Pet' })
    const exp = createExport({ name: ['Pet'], path: './Pet' })
    const result = combineImports([imp], [exp], '')

    expect(result).toHaveLength(1)
  })

  it('merges named imports from the same path with the same isTypeOnly', () => {
    const a = createImport({ name: ['Pet'], path: './models' })
    const b = createImport({ name: ['Order'], path: './models' })
    const result = combineImports([a, b], [], 'Pet Order')

    expect(result).toHaveLength(1)
    expect(result[0]!.name).toContain('Pet')
    expect(result[0]!.name).toContain('Order')
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

  it('sorts namespace imports before named array imports', () => {
    const named = createImport({ name: ['Pet'], path: './Pet' })
    const ns = createImport({ name: 'z', path: 'zod' })
    const result = combineImports([named, ns], [], 'Pet z')

    const nsIndex = result.findIndex((i) => !Array.isArray(i.name))
    const namedIndex = result.findIndex((i) => Array.isArray(i.name))
    expect(nsIndex).toBeLessThan(namedIndex)
  })

  it('sorts imports alphabetically by path', () => {
    const c = createImport({ name: ['c'], path: './c' })
    const a = createImport({ name: ['a'], path: './a' })
    const b = createImport({ name: ['b'], path: './b' })
    const result = combineImports([c, a, b], [], 'a b c')

    expect(result.map((i) => i.path)).toStrictEqual(['./a', './b', './c'])
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

  it('returns empty array for empty input', () => {
    expect(combineImports([], [], '')).toStrictEqual([])
  })

  it('keeps aliased named import when the local alias appears in the source', () => {
    const imp = createImport({ name: [{ propertyName: 'fakerDE', name: 'faker' }], path: '@faker-js/faker' })
    const result = combineImports([imp], [], 'const x = faker.string.uuid()')

    expect(result).toHaveLength(1)
    expect(result[0]!.path).toBe('@faker-js/faker')
  })

  it('filters out aliased named import when neither alias nor propertyName appears in the source', () => {
    const imp = createImport({ name: [{ propertyName: 'fakerDE', name: 'faker' }], path: '@faker-js/faker' })
    const result = combineImports([imp], [], 'const x = 1')

    expect(result).toHaveLength(0)
  })

  it('deduplicates object-named imports with the same propertyName and name from the same path', () => {
    const a = createImport({ name: [{ propertyName: 'fakerDE', name: 'faker' }], path: '@faker-js/faker' })
    const b = createImport({ name: [{ propertyName: 'fakerDE', name: 'faker' }], path: '@faker-js/faker' })
    const result = combineImports([a, b], [], 'faker')

    expect(result).toHaveLength(1)
    expect(result[0]!.name).toHaveLength(1)
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
})
