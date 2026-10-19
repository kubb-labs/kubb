import { describe, expect, it } from 'vitest'
import { escapePointerToken } from '@internals/utils'
import { adapterOas } from './adapter.ts'

const source = [
  'components:',
  '  schemas:',
  '    Pet:',
  '      properties:',
  '        owner:',
  "          $ref: '#/components/schemas/Owner'",
  '    a/b:',
  '      type: string',
  '',
].join('\n')

describe('OpenAPI source locations', () => {
  it('locates YAML keys and unescapes JSON pointer tokens', async () => {
    const locate = await adapterOas().createSourceLocator!(source)
    const owner = locate({ kind: 'schema', pointer: '#/components/schemas/Pet/properties/owner' })!
    expect(source.slice(owner.start, owner.end)).toBe('owner')
    const escaped = locate({ kind: 'schema', pointer: '#/components/schemas/a~1b' })!
    expect(source.slice(escaped.start, escaped.end)).toBe('a/b')
  })

  it('locates a missing reference at its usage and omits unknown pointers', async () => {
    const locate = await adapterOas().createSourceLocator!(source)
    const ref = locate({ kind: 'schema', pointer: '#/components/schemas/Owner', ref: '#/components/schemas/Owner' })!
    expect(source.slice(ref.start, ref.end)).toBe("'#/components/schemas/Owner'")
    expect(locate({ kind: 'schema', pointer: '#/components/schemas/Missing' })).toBeUndefined()
    expect(locate({ kind: 'config' })).toBeUndefined()
  })

  it.each(['discount%', 'discount%20', 'discount space', 'discount/a~b'])('locates the literal property name %s', async (name) => {
    const json = JSON.stringify({ properties: { [name]: { type: 'string' } } })
    const locate = await adapterOas().createSourceLocator!(json)
    const token = escapePointerToken(name)
    const range = locate({ kind: 'schema', pointer: `#/properties/${token}` })!
    expect(json.slice(range.start, range.end)).toBe(JSON.stringify(name))
  })

  it('locates an encoded unresolved reference at its original usage', async () => {
    const ref = '#/components/schemas/Price%20EUR'
    const json = JSON.stringify({ properties: { price: { $ref: ref } } })
    const locate = await adapterOas().createSourceLocator!(json)
    const range = locate({ kind: 'schema', pointer: ref, ref })!
    expect(json.slice(range.start, range.end)).toBe(JSON.stringify(ref))
  })

  it('locates JSON array elements', async () => {
    const json = JSON.stringify({ values: ['a', 'b'] })
    const locate = await adapterOas().createSourceLocator!(json)
    const range = locate({ kind: 'schema', pointer: '#/values/1' })!
    expect(json.slice(range.start, range.end)).toBe('"b"')
  })
})
