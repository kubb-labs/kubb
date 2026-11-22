import { describe, expect, it } from 'vitest'
import { createConst, createType } from '../nodes/code.ts'
import { createExport, createImport, createSource } from '../nodes/file.ts'
import type { ImportNode } from '../nodes/file.ts'
import { combineImports } from './combineFileMembers.ts'
import { getNames, getSpace } from './moduleNames.ts'

describe('getNames', () => {
  it.each([
    ['named import', createImport({ name: ['Pet'], path: 'x', isTypeOnly: true }), [{ name: 'Pet', space: 'type' }]],
    ['aliased import', createImport({ name: [{ propertyName: 'fakerEN', name: 'faker' }], path: 'x' }), [{ name: 'fakerEN', alias: 'faker', space: 'value' }]],
    ['default import', createImport({ name: 'useSWR', path: 'swr' }), [{ name: 'default', alias: 'useSWR', space: 'value' }]],
    ['namespace import', createImport({ name: 'z', path: 'zod', isNameSpace: true }), [{ name: '*', alias: 'z', space: 'value' }]],
    ['wildcard export', createExport({ path: './pet' }), [{ name: '*', space: 'value' }]],
    ['namespace export', createExport({ name: 'utils', path: './utils', asAlias: true }), [{ name: '*', alias: 'utils', space: 'value' }]],
  ])('converts a deprecated %s', (_label, node, names) => {
    expect(getNames(node)).toStrictEqual(names)
  })
})

describe('createImport', () => {
  it('fills in the deprecated fields from names', () => {
    const imp = createImport({ names: [{ name: '*', alias: 'z', space: 'value' }], path: 'zod' })

    expect([imp.name, imp.isNameSpace, imp.isTypeOnly]).toStrictEqual(['z', true, false])
  })

  it('marks every name as a type when a spread import passes isTypeOnly', () => {
    const imp = createImport({ names: [{ name: 'Pet', space: 'value' }], path: './pet' })

    expect(createImport({ ...imp, isTypeOnly: true }).names).toStrictEqual([{ name: 'Pet', space: 'type' }])
  })

  it('keeps each space when a spread import passes its own fields back', () => {
    const imp = createImport({
      names: [
        { name: 'Pet', space: 'type' },
        { name: 'petSchema', space: 'value' },
      ],
      path: './pet',
    })

    expect(createImport({ ...imp }).names).toStrictEqual(imp.names)
  })
})

describe('getSpace', () => {
  it.each([
    ['space', createSource({ name: 'Pet', space: 'type', isTypeOnly: false }), 'type'],
    ['the deprecated isTypeOnly', createSource({ name: 'Pet', isTypeOnly: true }), 'type'],
    ['a Type node', createSource({ name: 'Pet', nodes: [createType({ name: 'Pet' })] }), 'type'],
    ['a Const node', createSource({ name: 'pet', nodes: [createConst({ name: 'pet' })] }), 'value'],
  ])('reads the space from %s', (_label, source, space) => {
    expect(getSpace(source)).toBe(space)
  })
})

describe('combineImports', () => {
  it('prints the same imports for names as for the deprecated fields', () => {
    const deprecated = [
      createImport({ name: ['Pet'], path: './pet', isTypeOnly: true }),
      createImport({ name: ['petSchema'], path: './pet' }),
      createImport({ name: 'z', path: 'zod', isNameSpace: true }),
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
    ]
    const fields = (nodes: Array<ImportNode>) => nodes.map(({ name, path, isTypeOnly, isNameSpace }) => ({ name, path, isTypeOnly, isNameSpace }))

    expect(fields(combineImports(names, [], 'Pet petSchema z'))).toStrictEqual(fields(combineImports(deprecated, [], 'Pet petSchema z')))
  })
})
