import { describe, expect, it } from 'vitest'
import { createNode } from './createNode.ts'

describe('createNode', () => {
  it('copies the shared metadata of the schema onto the node', () => {
    const node = createNode(
      {
        schema: {
          title: 'Pet',
          description: 'A pet',
          deprecated: true,
          readOnly: true,
          example: 'Rex',
          format: 'name',
          externalDocs: { url: 'https://example.com' },
        },
        name: 'Pet',
        nullable: true,
        defaultValue: 'Rex',
      },
      { type: 'string', primitive: 'string' },
    )

    expect(node).toMatchObject({
      type: 'string',
      name: 'Pet',
      nullable: true,
      title: 'Pet',
      description: 'A pet',
      deprecated: true,
      readOnly: true,
      default: 'Rex',
      examples: ['Rex'],
      format: 'name',
      externalDocs: { url: 'https://example.com' },
    })
  })

  it('lets the converter fields win over the schema metadata', () => {
    const node = createNode(
      { schema: { format: 'int64', description: 'kept' }, name: 'Id', nullable: undefined, defaultValue: undefined },
      {
        type: 'string',
        format: 'override',
      },
    )

    expect(node).toMatchObject({ format: 'override', description: 'kept' })
  })
})
