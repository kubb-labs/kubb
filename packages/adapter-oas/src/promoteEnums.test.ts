import { ast } from '@kubb/core'
import { describe, expect, it } from 'vitest'
import { collectInlineEnums, refPromotedEnums } from './promoteEnums.ts'

const { createProperty, createSchema } = ast.factory
const { narrowSchema } = ast

function stringEnum(values: Array<string>, name?: string): ast.SchemaNode {
  return createSchema({ type: 'enum', primitive: 'string', enumValues: values, name } as Parameters<typeof createSchema>[0])
}

function objectWith(name: string, propName: string, schema: ast.SchemaNode): ast.SchemaNode {
  return createSchema({ type: 'object', name, properties: [createProperty({ name: propName, schema })] })
}

describe('collectInlineEnums', () => {
  it('collects an inline enum under its parser name', () => {
    const pet = objectWith('Pet', 'status', stringEnum(['active', 'inactive'], 'PetStatusEnum'))

    const promoted = collectInlineEnums([pet], new Set(['Pet']))

    expect([...promoted.keys()]).toStrictEqual(['PetStatusEnum'])
    expect(promoted.get('PetStatusEnum')).toMatchObject({ name: 'PetStatusEnum', type: 'enum', enumValues: ['active', 'inactive'] })
  })

  it('skips a top-level enum component', () => {
    const status = stringEnum(['active', 'inactive'], 'Status')

    expect(collectInlineEnums([status], new Set(['Status'])).size).toBe(0)
  })

  it('keeps one definition per name', () => {
    const pet = objectWith('Pet', 'status', stringEnum(['active', 'inactive'], 'PetStatusEnum'))
    const order = objectWith('Order', 'status', stringEnum(['active', 'inactive'], 'PetStatusEnum'))

    expect(collectInlineEnums([pet, order], new Set(['Pet', 'Order'])).size).toBe(1)
  })
})

describe('refPromotedEnums', () => {
  it('replaces a promoted inline enum with a ref', () => {
    const pet = objectWith('Pet', 'status', stringEnum(['active', 'inactive'], 'PetStatusEnum'))
    const promoted = collectInlineEnums([pet], new Set(['Pet']))

    const status = narrowSchema(refPromotedEnums(pet, promoted), 'object')!.properties.find((prop) => prop.name === 'status')!.schema
    expect(narrowSchema(status, 'ref')).toMatchObject({ name: 'PetStatusEnum', ref: '#/components/schemas/PetStatusEnum', type: 'ref' })
  })

  it('leaves a node without a promoted enum untouched', () => {
    const pet = objectWith('Pet', 'status', stringEnum(['active', 'inactive'], 'PetStatusEnum'))
    const promoted = collectInlineEnums([pet], new Set(['Pet']))

    const other = objectWith('Other', 'id', createSchema({ type: 'string' }))
    expect(refPromotedEnums(other, promoted)).toBe(other)
  })
})
