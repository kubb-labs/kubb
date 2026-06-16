import { describe, expect, it } from 'vitest'
import { createContent } from './content.ts'
import { createResponse } from './response.ts'
import { createSchema } from './schema.ts'

describe('createResponse', () => {
  it('creates a response with just a status code', () => {
    const node = createResponse({
      statusCode: '200',
      schema: createSchema({
        type: 'string',
      }),
    })

    expect(node.kind).toBe('Response')
    expect(node.statusCode).toBe('200')
  })

  it('normalizes a legacy schema into a single content entry', () => {
    const node = createResponse({
      statusCode: '200',
      schema: createSchema({ type: 'object' }),
      mediaType: 'application/json',
      description: 'Success',
    })

    expect(node.content?.[0]?.contentType).toBe('application/json')
    expect(node.content?.[0]?.schema?.type).toBe('object')
    expect(node.description).toBe('Success')
  })

  it('accepts an explicit content array', () => {
    const node = createResponse({
      statusCode: '200',
      content: [
        createContent({ contentType: 'application/json', schema: createSchema({ type: 'object' }) }),
        createContent({ contentType: 'application/xml', schema: createSchema({ type: 'string' }) }),
      ],
    })

    expect(node.content).toHaveLength(2)
    expect(node.content?.[1]?.contentType).toBe('application/xml')
  })
})
