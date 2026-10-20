import { describe, expect, it } from 'vitest'
import { escapePointerToken } from '@internals/utils'
import { locate as locateIn } from './sourceLocator.ts'

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
  it('locates YAML keys and unescapes JSON pointer tokens', () => {
    const owner = locateIn(source, { kind: 'schema', pointer: '#/components/schemas/Pet/properties/owner' })!
    expect(source.slice(owner.start, owner.end)).toBe('owner')
    const escaped = locateIn(source, { kind: 'schema', pointer: '#/components/schemas/a~1b' })!
    expect(source.slice(escaped.start, escaped.end)).toBe('a/b')
  })

  it('locates a missing reference at its usage and omits unknown pointers', () => {
    const ref = locateIn(source, { kind: 'schema', pointer: '#/components/schemas/Owner', ref: '#/components/schemas/Owner' })!
    expect(source.slice(ref.start, ref.end)).toBe("'#/components/schemas/Owner'")
    expect(locateIn(source, { kind: 'schema', pointer: '#/components/schemas/Missing' })).toBeUndefined()
    expect(locateIn(source, { kind: 'config' })).toBeUndefined()
  })

  it.each(['discount%', 'discount%20', 'discount space', 'discount/a~b'])('locates the literal property name %s', (name) => {
    const json = JSON.stringify({ properties: { [name]: { type: 'string' } } })
    const token = escapePointerToken(name)
    const range = locateIn(json, { kind: 'schema', pointer: `#/properties/${token}` })!
    expect(json.slice(range.start, range.end)).toBe(JSON.stringify(name))
  })

  it('locates an encoded unresolved reference at its original usage', () => {
    const ref = '#/components/schemas/Price%20EUR'
    const json = JSON.stringify({ properties: { price: { $ref: ref } } })
    const range = locateIn(json, { kind: 'schema', pointer: ref, ref })!
    expect(json.slice(range.start, range.end)).toBe(JSON.stringify(ref))
  })

  it('locates JSON array elements', () => {
    const json = JSON.stringify({ values: ['a', 'b'] })
    const range = locateIn(json, { kind: 'schema', pointer: '#/values/1' })!
    expect(json.slice(range.start, range.end)).toBe('"b"')
  })
})
