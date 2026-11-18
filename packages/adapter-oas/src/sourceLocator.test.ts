import { describe, expect, it, vi } from 'vitest'
import * as yaml from 'js-yaml'
import { escapePointerToken } from '@internals/utils'
import { locate as locateIn, rememberEvents } from './sourceLocator.ts'

vi.mock('js-yaml', async (importOriginal) => {
  const actual = await importOriginal<typeof import('js-yaml')>()
  return { ...actual, parseEvents: vi.fn(actual.parseEvents) }
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
  it('locates YAML keys, plain keys by the value they parse to, empty items, and unescapes JSON pointer tokens', () => {
    const owner = locateIn(source, { kind: 'schema', pointer: '#/components/schemas/Pet/properties/owner' })!
    expect(source.slice(owner.start, owner.end)).toBe('owner')
    const escaped = locateIn(source, { kind: 'schema', pointer: '#/components/schemas/a~1b' })!
    expect(source.slice(escaped.start, escaped.end)).toBe('a/b')
    const plain = '0x10: a\n~: b\n"\\x50": c\n'
    expect(locateIn(plain, { kind: 'schema', pointer: '#/16' })).toStrictEqual({ start: 0, end: 4 })
    expect(locateIn(plain, { kind: 'schema', pointer: '#/null' })).toStrictEqual({ start: 8, end: 9 })
    expect(locateIn(plain, { kind: 'schema', pointer: '#/P' })).toStrictEqual({ start: 13, end: 19 })
    const empty = 'items:\n  -\n  - a:\n'
    expect(locateIn(empty, { kind: 'schema', pointer: '#/items/0' })).toStrictEqual({ start: 9, end: 9 })
    expect(locateIn(empty, { kind: 'schema', pointer: '#/items/1' })).toStrictEqual({ start: 15, end: 16 })
  })

  it('locates a missing reference at its usage and omits unknown pointers', () => {
    const ref = locateIn(source, { kind: 'schema', pointer: '#/components/schemas/Owner', ref: '#/components/schemas/Owner' })!
    expect(source.slice(ref.start, ref.end)).toBe("'#/components/schemas/Owner'")
    const shadowed = "tags: ['$ref', '#/x']\na: $ref\n'#/x': 1\nb:\n  $ref: '#/x'\n"
    const real = shadowed.lastIndexOf("'#/x'")
    expect(locateIn(shadowed, { kind: 'schema', pointer: '#/missing', ref: '#/x' })).toStrictEqual({ start: real, end: real + 5 })
    expect(locateIn(source, { kind: 'schema', pointer: '#/components/schemas/Missing' })).toBeUndefined()
    expect(locateIn(source, { kind: 'config' })).toBeUndefined()
  })

  it.each(['discount%', 'discount/a~b'])('locates the literal property name %s', (name) => {
    const json = JSON.stringify({ properties: { [name]: { type: 'string' } } })
    const token = escapePointerToken(name)
    const range = locateIn(json, { kind: 'schema', pointer: `#/properties/${token}` })!
    expect(json.slice(range.start, range.end)).toBe(JSON.stringify(name))
  })

  it('locates sequence items, quoted keys and keys after a block scalar', () => {
    const text = [
      '---',
      '# a comment',
      'paths:',
      '  "/pets/{id}":',
      '    get:',
      '      description: |',
      '        parameters: not a key',
      '      parameters:',
      '      - name: limit',
      '        in: query',
      '',
      "      - $ref: '#/components/parameters/Offset' # shared",
      '      tags:',
      '        - pets',
      "  '/it''s':",
      '    get: {}',
      '    servers:',
      '      -',
      '        url: https://example.com',
      '',
    ].join('\r\n')
    const at = (pointer: string) => {
      const range = locateIn(text, { kind: 'operation', pointer })!
      return text.slice(range.start, range.end)
    }

    expect(at('#/paths/~1pets~1{id}')).toBe('"/pets/{id}"')
    expect(at('#/paths/~1pets~1{id}/get/parameters/0')).toBe('name: limit\r\n        in: query')
    expect(at('#/paths/~1pets~1{id}/get/parameters/0/in')).toBe('in')
    expect(at('#/paths/~1pets~1{id}/get/parameters/1')).toBe("$ref: '#/components/parameters/Offset'")
    expect(at('#/paths/~1pets~1{id}/get/tags/0')).toBe('pets')
    expect(at("#/paths/~1it's/get")).toBe('get')
    expect(at("#/paths/~1it's/servers/0")).toBe('url: https://example.com')
    expect(locateIn(text, { kind: 'operation', pointer: '#/paths/~1pets~1{id}/get/description/parameters' })).toBeUndefined()
    expect(locateIn(text, { kind: 'operation', pointer: '#/paths/~1pets~1{id}/get/parameters/2' })).toBeUndefined()
  })

  it('parses a source once, also for an equal but distinct string, and not at all for one the adapter loaded', () => {
    const parseEvents = vi.mocked(yaml.parseEvents)
    const pointer = '#/components/schemas/Pet/properties/owner'
    // A source no earlier test parsed, and a copy that is equal but not the same string.
    const fresh = `${source}\n`
    const copy = [...fresh].join('')
    parseEvents.mockClear()

    const first = locateIn(fresh, { kind: 'schema', pointer })
    expect(locateIn(copy, { kind: 'schema', pointer })).toStrictEqual(first)
    expect(parseEvents).toHaveBeenCalledTimes(1)

    locateIn(`${fresh}x: 1\n`, { kind: 'schema', pointer })
    expect(parseEvents).toHaveBeenCalledTimes(2)

    const loaded = `${fresh}y: 2\n`
    rememberEvents({ source: loaded, events: parseEvents(loaded, {}) })
    parseEvents.mockClear()
    expect(locateIn([...loaded].join(''), { kind: 'schema', pointer })).toStrictEqual(first)
    expect(parseEvents).not.toHaveBeenCalled()
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

  it('locates keys and array items', () => {
    const item = locateIn(json, { kind: 'operation', pointer: '#/paths/~1pets/get/parameters/1' })!
    const key = locateIn(json, { kind: 'schema', pointer: '#/components/schemas/a~1b' })!

    expect(JSON.parse(json.slice(item.start, item.end))).toStrictEqual({ $ref: '#/components/parameters/Offset' })
    expect(json.slice(key.start, key.end)).toBe('"a/b"')
    expect(locateIn(json, { kind: 'schema', pointer: '#/paths/~1pets/get/parameters/2' })).toBeUndefined()
    const deep = JSON.stringify({ paths: {}, nested: JSON.parse(`${'['.repeat(150)}${']'.repeat(150)}`) })
    expect(locateIn(deep, { kind: 'schema', pointer: '#/paths' })).toStrictEqual({ start: 1, end: 8 })
  })

  it('locates a missing reference at its first usage', () => {
    const ref = locateIn(json, { kind: 'schema', pointer: '#/components/schemas/Owner', ref: '#/components/schemas/Owner' })!

    expect(json.slice(ref.start, ref.end)).toBe('"#/components/schemas/Owner"')
  })

  it('locates flow-style YAML that is not plain JSON, and gives no location for text that is not YAML', () => {
    const flow = '{"components": {"schemas": {"Pet": {"type": "object"}}}, # flow-style YAML\n "paths": {"/pets": {"$ref": other.yaml#/Pets}}}\n'
    const pet = locateIn(flow, { kind: 'schema', pointer: '#/components/schemas/Pet' })!
    const ref = locateIn(flow, { kind: 'schema', pointer: '#/missing', ref: 'other.yaml#/Pets' })!

    expect(flow.slice(pet.start, pet.end)).toBe('"Pet"')
    expect(flow.slice(ref.start, ref.end)).toBe('other.yaml#/Pets')
    expect(locateIn('a: [1, 2\nb: }', { kind: 'schema', pointer: '#/a' })).toBeUndefined()
    const commented = 'x:\n  - {b: 1 # }\n    }\n'
    const item = locateIn(commented, { kind: 'schema', pointer: '#/x/0' })!
    expect(commented.slice(item.start, item.end)).toBe('{b: 1 # }\n    }')
  })
})
