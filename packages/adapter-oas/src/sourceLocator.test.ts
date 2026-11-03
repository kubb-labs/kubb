import { describe, expect, it, vi } from 'vitest'
import * as yaml from 'yaml'
import { escapePointerToken } from '@internals/utils'
import { locate as locateIn } from './sourceLocator.ts'

vi.mock('yaml', async (importOriginal) => {
  const actual = await importOriginal<typeof import('yaml')>()
  return { ...actual, parseDocument: vi.fn(actual.parseDocument) }
})

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

  it.each(['discount%', 'discount/a~b'])('locates the literal property name %s', (name) => {
    const json = JSON.stringify({ properties: { [name]: { type: 'string' } } })
    const token = escapePointerToken(name)
    const range = locateIn(json, { kind: 'schema', pointer: `#/properties/${token}` })!
    expect(json.slice(range.start, range.end)).toBe(JSON.stringify(name))
  })

  it('parses a source once, also when the next call passes an equal but distinct string', () => {
    const parseDocument = vi.mocked(yaml.parseDocument)
    const pointer = '#/components/schemas/Pet/properties/owner'
    // A source no earlier test parsed, and a copy that is equal but not the same string.
    const fresh = `${source}\n`
    const copy = [...fresh].join('')
    parseDocument.mockClear()

    const first = locateIn(fresh, { kind: 'schema', pointer })
    expect(locateIn(copy, { kind: 'schema', pointer })).toStrictEqual(first)
    expect(parseDocument).toHaveBeenCalledTimes(1)

    locateIn(`${fresh}x: 1\n`, { kind: 'schema', pointer })
    expect(parseDocument).toHaveBeenCalledTimes(2)
  })
})

describe('JSON source locations', () => {
  const json = JSON.stringify(
    {
      paths: { '/pets': { get: { parameters: [{ name: 'limit' }, { $ref: '#/components/parameters/Offset' }] } } },
      components: { schemas: { 'a/b': { type: 'string' }, Pet: { $ref: '#/components/schemas/Owner' } } },
    },
    null,
    2,
  )

  it('locates keys and array items without parsing a YAML document', () => {
    const parseDocument = vi.mocked(yaml.parseDocument)
    parseDocument.mockClear()

    const item = locateIn(json, { kind: 'operation', pointer: '#/paths/~1pets/get/parameters/1' })!
    const key = locateIn(json, { kind: 'schema', pointer: '#/components/schemas/a~1b' })!

    expect(JSON.parse(json.slice(item.start, item.end))).toStrictEqual({ $ref: '#/components/parameters/Offset' })
    expect(json.slice(key.start, key.end)).toBe('"a/b"')
    expect(locateIn(json, { kind: 'schema', pointer: '#/paths/~1pets/get/parameters/2' })).toBeUndefined()
    expect(parseDocument).not.toHaveBeenCalled()
  })

  it('locates a missing reference at its first usage', () => {
    const ref = locateIn(json, { kind: 'schema', pointer: '#/components/schemas/Owner', ref: '#/components/schemas/Owner' })!

    expect(json.slice(ref.start, ref.end)).toBe('"#/components/schemas/Owner"')
  })

  it('falls back to the YAML parser for flow-style YAML that is not plain JSON', () => {
    const parseDocument = vi.mocked(yaml.parseDocument)
    parseDocument.mockClear()
    const flow = '{"components": {"schemas": {"Pet": {"type": "object"}}}, # flow-style YAML\n "extra": {}}\n'
    const pet = locateIn(flow, { kind: 'schema', pointer: '#/components/schemas/Pet' })!

    expect(flow.slice(pet.start, pet.end)).toBe('"Pet"')
    expect(parseDocument).toHaveBeenCalledTimes(1)
  })

  it('falls back to the YAML parser for an unquoted $ref value', () => {
    const parseDocument = vi.mocked(yaml.parseDocument)
    parseDocument.mockClear()
    const flow = '{"paths": {"/pets": {"$ref": other.yaml#/Pets}}}\n'
    const ref = locateIn(flow, { kind: 'schema', pointer: '#/missing', ref: 'other.yaml#/Pets' })!

    expect(flow.slice(ref.start, ref.end)).toBe('other.yaml#/Pets')
    expect(parseDocument).toHaveBeenCalledTimes(1)
  })
})
