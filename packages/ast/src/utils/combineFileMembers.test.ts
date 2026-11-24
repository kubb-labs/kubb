import { describe, expect, it } from 'vitest'
import { createText } from '../nodes/code.ts'
import { createExport, createImport, createSource } from '../nodes/file.ts'
import { combineExports, combineImports, combineSources } from './combineFileMembers.ts'

describe('combineSources', () => {
  it('deduplicates by reference when name is absent', () => {
    const src = createSource({ nodes: [createText('const x = 1')] })
    const result = combineSources([src, src])

    expect(result).toHaveLength(1)
  })

  it('deduplicates sources named with an empty string by that name', () => {
    expect(combineSources([createSource({ name: '', nodes: [createText('a')] }), createSource({ name: '', nodes: [createText('b')] })])).toHaveLength(1)
  })

  it('keeps unnamed sources with the same text when they are different nodes', () => {
    const result = combineSources([createSource({ nodes: [createText('Deprecated.')] }), createSource({ nodes: [createText('Deprecated.')] })])

    expect(result).toHaveLength(2)
  })

  it.each(['export', 'isTypeOnly'] as const)('treats sources with the same name but different %s as distinct', (flag) => {
    const a = createSource({ name: 'Pet', nodes: [createText('export type Pet = {}')], [flag]: true })
    const b = createSource({ name: 'Pet', nodes: [createText('export type Pet = {}')], [flag]: false })

    expect(combineSources([a, b])).toHaveLength(2)
  })

  it('reads the deprecated isIndexable as export', () => {
    const a = createSource({ name: 'Pet', nodes: [createText('export type Pet = {}')], export: true })
    const b = createSource({ name: 'Pet', nodes: [createText('export type Pet = {}')], isIndexable: true })

    expect(combineSources([a, b])).toHaveLength(1)
  })
})

describe('combineExports', () => {
  it('returns one export per path with the names merged, deduplicated and sorted', () => {
    const pet = createExport({ name: ['Pet'], path: './models' })
    const order = createExport({ name: ['Order'], path: './models' })
    const result = combineExports([pet, pet, order])

    expect(result).toMatchObject([{ kind: 'Export', name: ['Order', 'Pet'], path: './models' }])
  })

  it('keeps type-only and value exports from the same path separate', () => {
    const value = createExport({
      name: ['petSchema'],
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
  ])('keeps $label when its local name appears in the source', ({ imp }) => {
    expect(combineImports([imp], [], 'const schema = z.string()')).toMatchObject([{ name: imp.name, path: imp.path }])
  })

  it.each([{ label: 'an aliased named import', imp: createImport({ name: [{ propertyName: 'fakerDE', name: 'faker' }], path: '@faker-js/faker' }) }])(
    'filters out $label when its name does not appear in the source',
    ({ imp }) => {
      expect(combineImports([imp], [], 'const x = 1')).toStrictEqual([])
    },
  )

  it('retains imports that are re-exported even when the source does not use them', () => {
    const imp = createImport({ name: ['Pet'], path: './Pet' })
    const exp = createExport({ name: ['Pet'], path: './Pet' })

    expect(combineImports([imp], [exp], 'const x = 1')).toHaveLength(1)
  })

  it('drops a type import of a name the same path already imports as a value', () => {
    const asType = createImport({ names: [{ name: 'PetStatus', space: 'type' }], path: './models' })
    const asValue = createImport({
      names: [
        { name: 'PetStatus', space: 'value' },
        { name: 'Pet', space: 'type' },
      ],
      path: './models',
    })

    expect(combineImports([asType, asValue], [], 'PetStatus Pet').map((imp) => imp.names)).toStrictEqual([
      [{ name: 'Pet', space: 'type' }],
      [{ name: 'PetStatus', space: 'value' }],
    ])
  })

  it('keeps every import when there is no source to check against', () => {
    expect(combineImports([createImport({ name: ['unused'], path: 'lodash' })], [], '')).toHaveLength(1)
  })

  it('returns one import per path with the names merged, deduplicated and sorted', () => {
    const pet = createImport({ name: ['Pet'], path: './models' })
    const order = createImport({ name: ['Order'], path: './models' })
    const aliased = createImport({ name: [{ propertyName: 'fakerDE', name: 'faker' }], path: '@faker-js/faker' })
    const result = combineImports([pet, pet, order, aliased, aliased], [], 'Pet Order faker')

    expect(result).toMatchObject([
      { kind: 'Import', name: ['Order', 'Pet'], path: './models' },
      { kind: 'Import', name: [{ propertyName: 'fakerDE', name: 'faker' }], path: '@faker-js/faker' },
    ])
  })

  it('sorts local imports by their specifier relative to the importing file', () => {
    const root = '/project/src/hooks/usePet.ts'
    const scoped = createImport({ name: ['fetch'], path: '@kubb/fetch' })
    const sibling = createImport({ name: ['helper'], path: '/project/src/hooks/helper.ts', root })
    const parent = createImport({ name: ['Pet'], path: '/project/src/types/Pet.ts', root })

    expect(combineImports([scoped, sibling, parent], [], 'fetch helper Pet').map((i) => i.path)).toStrictEqual([parent.path, sibling.path, scoped.path])
  })

  it('sorts the same paths by each importing file, not by the first one seen', () => {
    const helper = '/project/src/hooks/helper.ts'
    const pet = '/project/src/types/Pet.ts'
    const sortFrom = (root: string) =>
      combineImports([createImport({ name: ['helper'], path: helper, root }), createImport({ name: ['Pet'], path: pet, root })], [], 'helper Pet').map(
        (i) => i.path,
      )

    expect(sortFrom('/project/src/hooks/usePet.ts')).toStrictEqual([pet, helper])
    expect(sortFrom('/project/src/types/Order.ts')).toStrictEqual([helper, pet])
  })

  it('keeps value and type-only imports from the same path separate', () => {
    const value = createImport({
      name: ['petSchema'],
      path: './models',
      isTypeOnly: false,
    })
    const typeOnly = createImport({
      name: ['Pet'],
      path: './models',
      isTypeOnly: true,
    })
    const result = combineImports([value, typeOnly], [], 'Pet petSchema')

    expect(result).toHaveLength(2)
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

  it('keeps a default import when a named import from the same path is used', () => {
    const client = createImport({ name: 'client', path: '@kubb/plugin-axios/clients/axios' })
    const types = createImport({ name: ['Client'], path: '@kubb/plugin-axios/clients/axios', isTypeOnly: true })
    // The merged grouped source omits the function body, so `client` is absent, but `Client` is referenced.
    const result = combineImports([client, types], [], 'type Options = Client')

    expect(result).toMatchObject([{ name: 'client' }, { name: ['Client'], isTypeOnly: true }])
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
