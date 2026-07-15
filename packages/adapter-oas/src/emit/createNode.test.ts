import { describe, expect, it } from 'vitest'
import { createNode } from './createNode.ts'

describe('createNode', () => {
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
    const node = createNode({ schema, name: 'myName', nullable: true, defaultValue: 'defaultVal' }, { type: 'string', primitive: 'string' })

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
    const node = createNode({ schema: {}, name: undefined, nullable: undefined, defaultValue: undefined }, { type: 'string', primitive: 'string' })

    expect(node.name).toBeUndefined()
    expect(node.nullable).toBeUndefined()
    expect(node.title).toBeUndefined()
    expect(node.default).toBeUndefined()
    expect(node.format).toBeUndefined()
  })
})
