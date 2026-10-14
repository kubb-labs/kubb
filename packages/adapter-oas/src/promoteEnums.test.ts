import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { collectInlineEnums } from './promoteEnums.ts'

const { createProperty, createSchema } = ast.factory

function stringEnum(values: Array<string>, name?: string): ast.SchemaNode {
  return createSchema({ type: 'enum', primitive: 'string', enumValues: values, name } as Parameters<typeof createSchema>[0])
}

function objectWith(name: string, propName: string, schema: ast.SchemaNode): ast.SchemaNode {
  return createSchema({ type: 'object', name, properties: [createProperty({ name: propName, schema })] })
}

describe('collectInlineEnums', () => {
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
