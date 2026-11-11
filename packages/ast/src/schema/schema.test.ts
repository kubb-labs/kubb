import { describe, expect, it } from 'vitest'
import { createSchema } from '../nodes/schema.ts'
import { jsonContent } from './index.ts'

describe('schema.jsonContent', () => {
  const inner = createSchema({ type: 'object', properties: [] })

  it('returns the schema of a JSON string', () => {
    expect(jsonContent({ content: { mediaType: 'application/json', schema: inner } })).toBe(inner)
  })

  it('ignores other media types, encoded content, or no schema', () => {
    expect(jsonContent({ content: { mediaType: 'text/plain', schema: inner } })).toBeUndefined()
    expect(jsonContent({ content: { mediaType: 'application/json', encoding: 'base64', schema: inner } })).toBeUndefined()
    expect(jsonContent({ content: { mediaType: 'application/json' } })).toBeUndefined()
  })
})
