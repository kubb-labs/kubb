import { describe, expect, expectTypeOf, it } from 'vitest'
import { buildSchemaNode } from './createNode.ts'

describe('buildSchemaNode', () => {
  it('builds a node with all metadata fields', () => {
    const schema = {
      title: 'My Schema',
      description: 'A description',
      deprecated: true,
      readOnly: true,
      writeOnly: false,
      examples: [42],
      format: 'email',
    }
    const node = buildSchemaNode(schema, 'myName', true, 'defaultVal')

    expect(node).toMatchObject({
      default: 'defaultVal',
      deprecated: true,
      description: 'A description',
      examples: [42],
      format: 'email',
      name: 'myName',
      nullable: true,
      readOnly: true,
      title: 'My Schema',
      writeOnly: false,
    })
  })

  it('passes through undefined fields as undefined', () => {
    const node = buildSchemaNode({}, undefined, undefined, undefined)

    expect(node.name).toBeUndefined()
    expect(node.nullable).toBeUndefined()
    expect(node.title).toBeUndefined()
    expect(node.default).toBeUndefined()
    expect(node.format).toBeUndefined()
  })

  it('return type has name and nullable fields', () => {
    const node = buildSchemaNode({}, 'x', undefined, null)

    expectTypeOf(node.name).toEqualTypeOf<string | null | undefined>()
    expectTypeOf(node.nullable).toEqualTypeOf<true | undefined>()
  })
})
