import { describe, expect, it } from 'vitest'
import { createConst, createType } from '../nodes/code.ts'
import { createExport, createImport, createSource } from '../nodes/file.ts'
import type { ImportNode } from '../nodes/file.ts'
import { combineExports, combineImports } from './combineFileMembers.ts'
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

  it('uses new names passed on a spread import instead of the stale deprecated fields', () => {
    const imp = createImport({ names: [{ name: 'Pet', space: 'type' }], path: './pet' })
    const next = createImport({
      ...imp,
      names: [
        { name: 'Pet', space: 'type' },
        { name: 'petSchema', space: 'value' },
      ],
    })

    expect(next.names).toStrictEqual([
      { name: 'Pet', space: 'type' },
      { name: 'petSchema', space: 'value' },
    ])
    expect([next.name, next.isTypeOnly]).toStrictEqual([['Pet', 'petSchema'], false])
  })

  it('still lets a spread import override names with a deprecated name', () => {
    const imp = createImport({ names: [{ name: 'Pet', space: 'value' }], path: './pet' })
    const next = createImport({ ...imp, name: ['Tag'] })

    expect([next.names, next.name]).toStrictEqual([null, ['Tag']])
  })

  it('treats a name array changed in place as an override', () => {
    const imp = createImport({ names: [{ name: 'Pet', space: 'value' }], path: './pet' })
    ;(imp.name as Array<string>).push('Tag')
    const next = createImport({ ...imp })

    expect([next.names, next.name]).toStrictEqual([null, ['Pet', 'Tag']])
  })

  it('applies a changed isTypeOnly together with new names', () => {
    const imp = createImport({ names: [{ name: 'Pet', space: 'value' }], path: './pet' })

    expect(createImport({ ...imp, names: [{ name: 'Tag', space: 'value' }], isTypeOnly: true }).names).toStrictEqual([{ name: 'Tag', space: 'type' }])
  })
})

describe('createExport', () => {
  it('uses new names passed on a spread export instead of the stale deprecated fields', () => {
    const exp = createExport({ names: [{ name: 'Pet' }], path: './pet' })
    const next = createExport({ ...exp, names: [{ name: 'Tag' }] })

    expect([next.names, next.name]).toStrictEqual([[{ name: 'Tag' }], ['Tag']])
  })

  it('still lets a spread export override names with a deprecated name', () => {
    const exp = createExport({ names: [{ name: 'Pet' }], path: './pet' })

    expect(createExport({ ...exp, name: ['Tag'] }).names).toBeNull()
  })

  it('uses new names on a spread of a combined import or export', () => {
    const [imp] = combineImports([createImport({ names: [{ name: 'Pet' }], path: './pet' })], [])
    const [exp] = combineExports([createExport({ names: [{ name: 'Pet' }], path: './pet' })])

    expect(createImport({ ...imp!, names: [{ name: 'Tag' }] }).names).toStrictEqual([{ name: 'Tag' }])
    expect(createExport({ ...exp!, names: [{ name: 'Tag' }] }).names).toStrictEqual([{ name: 'Tag' }])
  })

  it('drops the stale name when a spread export becomes a wildcard export', () => {
    const exp = createExport({ names: [{ name: 'Pet' }], path: './pet' })
    const next = createExport({ ...exp, names: [{ name: '*' }] })

    expect([next.names, next.name]).toStrictEqual([[{ name: '*' }], undefined])
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
