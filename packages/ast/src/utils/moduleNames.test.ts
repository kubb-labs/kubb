import { describe, expect, it } from 'vitest'
import { createConst, createText, createType } from '../nodes/code.ts'
import { createExport, createImport, createSource } from '../nodes/file.ts'
import type { ExportNode, ImportNode } from '../nodes/file.ts'
import { combineExports, combineImports } from './combineFileMembers.ts'
import { getNames, getSpace } from './moduleNames.ts'

describe('getNames', () => {
  it.each([
    [
      'named',
      createImport({ name: ['a', 'b'], path: 'x' }),
      [
        { name: 'a', space: 'value' },
        { name: 'b', space: 'value' },
      ],
    ],
    ['aliased', createImport({ name: [{ propertyName: 'fakerEN', name: 'faker' }], path: 'x' }), [{ name: 'fakerEN', alias: 'faker', space: 'value' }]],
    ['default', createImport({ name: 'useSWR', path: 'swr' }), [{ name: 'default', alias: 'useSWR', space: 'value' }]],
    ['namespace', createImport({ name: 'z', path: 'zod', isNameSpace: true }), [{ name: '*', alias: 'z', space: 'value' }]],
    ['type-only', createImport({ name: ['Pet'], path: 'x', isTypeOnly: true }), [{ name: 'Pet', space: 'type' }]],
    ['explicit value', createImport({ name: ['Pet'], path: 'x', isTypeOnly: false }), [{ name: 'Pet', space: 'value' }]],
  ])('converts a deprecated %s import', (_label, node, names) => {
    expect(getNames(node)).toStrictEqual(names)
  })

  it.each([
    ['wildcard', createExport({ path: './pet' }), [{ name: '*', space: 'value' }]],
    ['namespace alias', createExport({ name: 'utils', path: './utils', asAlias: true }), [{ name: '*', alias: 'utils', space: 'value' }]],
    ['single name', createExport({ name: 'Pet', path: './pet' }), [{ name: 'Pet', space: 'value' }]],
    ['type-only names', createExport({ name: ['Pet'], path: './pet', isTypeOnly: true }), [{ name: 'Pet', space: 'type' }]],
  ])('converts a deprecated %s export', (_label, node, names) => {
    expect(getNames(node)).toStrictEqual(names)
  })

  it('returns the names a node was built from', () => {
    const names = [{ name: 'Pet' }]

    expect(getNames(createImport({ names, path: './pet' }))).toBe(names)
  })
})

describe('createImport and createExport from names', () => {
  it('fill in the deprecated fields for code that still reads them', () => {
    const imp: ImportNode = createImport({ names: [{ name: '*', alias: 'z', space: 'value' }], path: 'zod' })
    const exp: ExportNode = createExport({ names: [{ name: 'Pet', space: 'type' }], path: './pet' })

    expect([imp.name, imp.isNameSpace, imp.isTypeOnly]).toStrictEqual(['z', true, false])
    expect([exp.name, exp.isTypeOnly, exp.asAlias]).toStrictEqual([['Pet'], true, false])
  })

  it('let names win over deprecated fields passed with them', () => {
    const imp = createImport({ names: [{ name: 'Pet', space: 'value' }], path: './pet', isTypeOnly: true })

    expect([imp.names, imp.isTypeOnly]).toStrictEqual([[{ name: 'Pet', space: 'value' }], false])
  })
})

describe('getSpace', () => {
  it('reads space, then the deprecated isTypeOnly, then a Type node', () => {
    expect(getSpace(createSource({ name: 'Pet', space: 'type', isTypeOnly: false }))).toBe('type')
    expect(getSpace(createSource({ name: 'Pet', isTypeOnly: true }))).toBe('type')
    expect(getSpace(createSource({ name: 'Pet', nodes: [createType({ name: 'Pet' })] }))).toBe('type')
    expect(getSpace(createSource({ name: 'pet', nodes: [createConst({ name: 'pet' })] }))).toBe('value')
    expect(getSpace(createSource({ name: 'pet', nodes: [createText('const pet = 1')] }))).toBe('value')
  })
})

describe('combining names and deprecated fields', () => {
  it('prints the same imports for names as for the deprecated fields', () => {
    const deprecated = [
      createImport({ name: ['Pet'], path: './pet', isTypeOnly: true }),
      createImport({ name: ['petSchema'], path: './pet' }),
      createImport({ name: 'z', path: 'zod', isNameSpace: true }),
      createImport({ name: [{ propertyName: 'fakerEN', name: 'faker' }], path: '@faker-js/faker' }),
    ]
    const names = [
      createImport({
        names: [
          { name: 'Pet', space: 'type' },
          { name: 'petSchema', space: 'value' },
        ],
        path: './pet',
      }),
      createImport({ names: [{ name: '*', alias: 'z', space: 'value' }], path: 'zod' }),
      createImport({ names: [{ name: 'fakerEN', alias: 'faker', space: 'value' }], path: '@faker-js/faker' }),
    ]
    const fields = (nodes: Array<ImportNode>) =>
      nodes.map(({ name, path, isTypeOnly, isNameSpace }) => ({ name, path, isTypeOnly: !!isTypeOnly, isNameSpace: !!isNameSpace }))
    const source = 'Pet petSchema z faker'

    expect(fields(combineImports(names, [], source))).toStrictEqual(fields(combineImports(deprecated, [], source)))
  })

  it('keeps an import with an open space once, with its unused names dropped', () => {
    const open = createImport({ names: [{ name: 'Pet' }, { name: 'Unused' }], root: '/src/a.ts', path: '/src/pet.ts' })

    expect(combineImports([open, open], [], 'Pet').map((imp) => imp.names)).toStrictEqual([[{ name: 'Pet' }]])
  })

  it('keeps an open name once per path and alias', () => {
    const a = createExport({ names: [{ name: 'Pet', alias: 'Animal' }], path: './pet' })
    const b = createExport({ names: [{ name: 'Dog', alias: 'Animal' }], path: './pet' })

    expect(combineExports([a, b]).flatMap((exp) => exp.names ?? [])).toHaveLength(1)
  })

  it('keeps a default import when an open named import from the same path is used', () => {
    const client = createImport({ name: 'client', path: './client' })
    const open = createImport({ names: [{ name: 'Client' }], path: './client' })

    expect(combineImports([client, open], [], 'type Wrapped = Client').map((imp) => imp.name)).toStrictEqual(['client', ['Client']])
  })

  it('keeps an aliased named export in names, since the deprecated fields cannot hold it', () => {
    const aliased = createExport({ names: [{ name: 'Pet', alias: 'Animal', space: 'type' }], path: './pet' })

    expect(combineExports([aliased]).map((exp) => exp.names)).toStrictEqual([[{ name: 'Pet', alias: 'Animal', space: 'type' }]])
  })
})
