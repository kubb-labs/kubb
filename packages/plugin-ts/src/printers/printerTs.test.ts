import { createProperty, createSchema } from '@kubb/ast'
import { print } from '@kubb/fabric-core/parsers/typescript'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { format } from '#mocks'
import { resolverTs } from '../resolvers/resolverTs.ts'
import { printerTs } from './printerTs.ts'

/**
 * Wraps a `ts.TypeNode` in `type _ = <node>` so prettier can parse it as a
 * valid TypeScript statement, then strips the wrapper from the result.
 */
const formatTS = async (node: ts.Node | null | undefined): Promise<string> => {
  if (!node) return ''

  const alias = ts.factory.createTypeAliasDeclaration(undefined, '_', undefined, node as ts.TypeNode)
  const source = print(alias)
  const formatted = await format(source)

  return formatted
    .replace(/^type _ = /, '')
    .replace(/;\s*$/, '')
    .trim()
}

describe('printerTs', () => {
  const printer = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'inlineLiteral' })

  describe('scalar types', () => {
    it('any', async () => {
      const result = printer.transform(createSchema({ type: 'any' }))

      expect(await formatTS(result)).toBe('any')
    })

    it('unknown', async () => {
      const result = printer.transform(createSchema({ type: 'unknown' }))

      expect(await formatTS(result)).toBe('unknown')
    })

    it('void', async () => {
      const result = printer.transform(createSchema({ type: 'void' }))

      expect(await formatTS(result)).toBe('void')
    })

    it('boolean', async () => {
      const result = printer.transform(createSchema({ type: 'boolean' }))

      expect(await formatTS(result)).toBe('boolean')
    })

    it('null', async () => {
      const result = printer.transform(createSchema({ type: 'null' }))

      expect(await formatTS(result)).toBe('null')
    })

    it('string', async () => {
      const result = printer.transform(createSchema({ type: 'string' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('uuid', async () => {
      const result = printer.transform(createSchema({ type: 'uuid' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('email', async () => {
      const result = printer.transform(createSchema({ type: 'email' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('url', async () => {
      const result = printer.transform(createSchema({ type: 'url' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('datetime', async () => {
      const result = printer.transform(createSchema({ type: 'datetime' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('number', async () => {
      const result = printer.transform(createSchema({ type: 'number' }))

      expect(await formatTS(result)).toBe('number')
    })

    it('integer', async () => {
      const result = printer.transform(createSchema({ type: 'integer' }))

      expect(await formatTS(result)).toBe('number')
    })

    it('bigint', async () => {
      const result = printer.transform(createSchema({ type: 'bigint' }))

      expect(await formatTS(result)).toBe('bigint')
    })

    it('blob', async () => {
      const result = printer.transform(createSchema({ type: 'blob' }))

      expect(await formatTS(result)).toBe('Blob')
    })
  })

  describe('date / time', () => {
    it('date with representation=date returns Date', async () => {
      const result = printer.transform(createSchema({ type: 'date', representation: 'date' }))

      expect(await formatTS(result)).toBe('Date')
    })

    it('date without date representation returns string', async () => {
      const result = printer.transform(createSchema({ type: 'date', representation: 'string' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('time with representation=date returns Date', async () => {
      const result = printer.transform(createSchema({ type: 'time', representation: 'date' }))

      expect(await formatTS(result)).toBe('Date')
    })

    it('time without date representation returns string', async () => {
      const result = printer.transform(createSchema({ type: 'time', representation: 'string' }))

      expect(await formatTS(result)).toBe('string')
    })
  })

  describe('ref', () => {
    it('ref with name returns type reference', async () => {
      const result = printer.transform(createSchema({ type: 'ref', name: 'MyType' }))

      expect(await formatTS(result)).toBe('MyType')
    })

    it('ref without name returns undefined', () => {
      const result = printer.transform(createSchema({ type: 'ref' }))

      expect(result).toBeUndefined()
    })

    it('ref with $ref path uses canonical name from path, not node.name (Bug 1: allOf name override)', async () => {
      // When allOf flatten overrides node.name to the property name ("content"),
      // the printer should still resolve to the $ref target name ("TestContent").
      const result = printer.transform(createSchema({ type: 'ref', name: 'content', ref: '#/components/schemas/TestContent' }))

      expect(await formatTS(result)).toBe('TestContent')
    })

    it('ref with $ref path resolves discriminator child to parent (Bug 2: circular discriminator)', async () => {
      // ClientDisconnectedProblem allOf $ref -> Problem. The node.name is overridden
      // to "ClientDisconnectedProblem" by the flatten, but the ref points to Problem.
      const result = printer.transform(createSchema({ type: 'ref', name: 'ClientDisconnectedProblem', ref: '#/components/schemas/Problem' }))

      expect(await formatTS(result)).toBe('Problem')
    })

    it('ref without $ref path (inline ref) uses node.name directly', async () => {
      // Inline refs from getImports/utils don't carry a $ref path — node.name is the resolved type.
      const result = printer.transform(createSchema({ type: 'ref', name: 'ResolvedType' }))

      expect(await formatTS(result)).toBe('ResolvedType')
    })

    it('ref with $ref path falls back to node.name when path segment missing', async () => {
      // Defensive: if $ref path has no segments, fall back to node.name
      const result = printer.transform(createSchema({ type: 'ref', name: 'FallbackType', ref: '' }))

      expect(await formatTS(result)).toBe('FallbackType')
    })
  })

  describe('enum', () => {
    it('inlineLiteral (default) renders literal union', async () => {
      const result = printer.transform(createSchema({ type: 'enum', enumValues: ['a', 'b', 'c'] }))

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'a' | 'b' | 'c'"`)
    })

    it('inlineLiteral with mixed types', async () => {
      const result = printer.transform(createSchema({ type: 'enum', enumValues: ['x', 1, true] }))

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'x' | 1 | true"`)
    })

    it('enum without name still renders inline literal even when enumType is not inlineLiteral', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'enum' })
      const result = p.transform(createSchema({ type: 'enum', enumValues: ['a', 'b'] }))

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'a' | 'b'"`)
    })

    it('enum with name and enumType=enum renders reference', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'enum' })
      const result = p.transform(createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('Status')
    })

    it('enum with name and enumType=asConst renders reference with Key suffix', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'asConst', enumTypeSuffix: 'Key' })
      const result = p.transform(createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('StatusKey')
    })

    it('enum with name and enumType=asPascalConst renders reference with Key suffix', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'asPascalConst', enumTypeSuffix: 'Key' })
      const result = p.transform(createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('StatusKey')
    })

    it('enum with name and enumType=literal renders reference', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'literal' })
      const result = p.transform(createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('Status')
    })

    it('enum with name and enumType=constEnum renders reference without Key suffix', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'constEnum' })
      const result = p.transform(createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('Status')
    })

    it('namedEnumValues are used when provided', async () => {
      const result = printer.transform(
        createSchema({
          type: 'enum',
          namedEnumValues: [
            { name: 'Active', value: 'active', primitive: 'string' },
            { name: 'Inactive', value: 'inactive', primitive: 'string' },
          ],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'active' | 'inactive'"`)
    })

    it('namedEnumValues take precedence over enumValues', async () => {
      const result = printer.transform(
        createSchema({
          type: 'enum',
          namedEnumValues: [{ name: 'Yes', value: 1, primitive: 'number' }],
          enumValues: ['ignored'],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"1"`)
    })
  })

  describe('union', () => {
    it('renders a union of members', async () => {
      const result = printer.transform(
        createSchema({
          type: 'union',
          members: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
        }),
      )

      expect(await formatTS(result)).toBe('string | number')
    })

    it('renders nested union', async () => {
      const result = printer.transform(
        createSchema({
          type: 'union',
          members: [
            createSchema({ type: 'string' }),
            createSchema({ type: 'union', members: [createSchema({ type: 'number' }), createSchema({ type: 'boolean' })] }),
          ],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"string | (number | boolean)"`)
    })

    it('renders string & {} when union has string literal and plain string', async () => {
      const result = printer.transform(
        createSchema({
          type: 'union',
          members: [createSchema({ type: 'enum', primitive: 'string', enumValues: ['test'] }), createSchema({ type: 'email' })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'test' | (string & {})"`)
    })

    it('renders string & {} when union has const-derived string enum (primitive only) and plain string', async () => {
      const result = printer.transform(
        createSchema({
          type: 'union',
          members: [createSchema({ type: 'enum', primitive: 'string', enumValues: ['accepted'] }), createSchema({ type: 'string' })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'accepted' | (string & {})"`)
    })
  })

  describe('intersection', () => {
    it('renders an intersection of members', async () => {
      const result = printer.transform(
        createSchema({
          type: 'intersection',
          members: [
            createSchema({ type: 'object', properties: [createProperty({ name: 'a', required: true, schema: createSchema({ type: 'string' }) })] }),
            createSchema({ type: 'object', properties: [createProperty({ name: 'b', required: true, schema: createSchema({ type: 'number' }) })] }),
          ],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @type string
           */
          a: string
        } & {
          /**
           * @type number
           */
          b: number
        }"
      `)
    })
  })

  describe('array', () => {
    it('arrayType=array renders T[]', async () => {
      const result = printer.transform(
        createSchema({
          type: 'array',
          items: [createSchema({ type: 'string' })],
        }),
      )

      expect(await formatTS(result)).toBe('string[]')
    })

    it('arrayType=generic renders Array<T>', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'generic', enumType: 'inlineLiteral' })
      const result = p.transform(
        createSchema({
          type: 'array',
          items: [createSchema({ type: 'number' })],
        }),
      )

      expect(await formatTS(result)).toBe('Array<number>')
    })

    it('renders array with multiple item types as union', async () => {
      const result = printer.transform(
        createSchema({
          type: 'array',
          items: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"(string | number)[]"`)
    })
  })

  describe('tuple', () => {
    it('renders a basic tuple', async () => {
      const result = printer.transform(
        createSchema({
          type: 'tuple',
          items: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
        }),
      )

      expect(await formatTS(result)).toBe('[string, number]')
    })

    it('renders tuple with rest element', async () => {
      const result = printer.transform(
        createSchema({
          type: 'tuple',
          items: [createSchema({ type: 'string' })],
          rest: createSchema({ type: 'number' }),
        }),
      )

      expect(await formatTS(result)).toBe('[string, ...number[]]')
    })

    it('renders tuple with min — optional items after min', async () => {
      const result = printer.transform(
        createSchema({
          type: 'tuple',
          items: [createSchema({ type: 'string' }), createSchema({ type: 'number' }), createSchema({ type: 'boolean' })],
          min: 1,
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"[string, number?, boolean?]"`)
    })

    it('renders tuple with max — items truncated to max', async () => {
      const result = printer.transform(
        createSchema({
          type: 'tuple',
          items: [createSchema({ type: 'string' }), createSchema({ type: 'number' }), createSchema({ type: 'boolean' })],
          max: 2,
        }),
      )

      expect(await formatTS(result)).toBe('[string, number]')
    })

    it('renders tuple with max and rest — fills up to max with rest type', async () => {
      const result = printer.transform(
        createSchema({
          type: 'tuple',
          items: [createSchema({ type: 'string' })],
          rest: createSchema({ type: 'number' }),
          max: 3,
        }),
      )

      expect(await formatTS(result)).toBe('[string, number, number]')
    })
  })

  describe('object', () => {
    it('empty object returns object keyword', async () => {
      const result = printer.transform(createSchema({ type: 'object' }))

      expect(await formatTS(result)).toBe('object')
    })

    it('renders object with properties', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [
            createProperty({ name: 'id', required: true, schema: createSchema({ type: 'number' }) }),
            createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) }),
          ],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @type number
           */
          id: number
          /**
           * @type string
           */
          name: string
        }"
      `)
    })

    it('optional property with optionalType=questionToken', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string', optional: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @type string | undefined
           */
          tag?: string
        }"
      `)
    })

    it('optional property with optionalType=undefined adds | undefined', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'undefined', arrayType: 'array', enumType: 'inlineLiteral' })
      const result = p.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string', optional: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @type string | undefined
           */
          tag: string | undefined
        }"
      `)
    })

    it('optional property with optionalType=questionTokenAndUndefined adds both', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionTokenAndUndefined', arrayType: 'array', enumType: 'inlineLiteral' })
      const result = p.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string', optional: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @type string | undefined
           */
          tag?: string | undefined
        }"
      `)
    })

    it('nullable property adds | null', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'value', required: true, schema: createSchema({ type: 'string', nullable: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @type string
           */
          value: string | null
        }"
      `)
    })

    it('readonly property', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'id', required: true, schema: createSchema({ type: 'number', readOnly: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @type number
           */
          readonly id: number
        }"
      `)
    })

    it('additionalProperties=true adds index signature of unknown', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [],
          additionalProperties: true,
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          [key: string]: unknown
        }"
      `)
    })

    it('additionalProperties as SchemaNode adds typed index signature', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [],
          additionalProperties: createSchema({ type: 'string' }),
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          [key: string]: string
        }"
      `)
    })

    it('additionalProperties with existing properties uses unknown for index', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'id', required: true, schema: createSchema({ type: 'number' }) })],
          additionalProperties: createSchema({ type: 'string' }),
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @type number
           */
          id: number
          [key: string]: unknown
        }"
      `)
    })

    it('patternProperties adds index signature', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [],
          patternProperties: { '^S_': createSchema({ type: 'string' }) },
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          [key: string]: string
        }"
      `)
    })

    it('patternProperties with nullable adds | null to index type', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [],
          patternProperties: { '^S_': createSchema({ type: 'string', nullable: true }) },
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          [key: string]: string | null
        }"
      `)
    })

    it('nullish property with optionalType=questionToken adds ?', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string', nullish: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @type string | undefined
           */
          tag?: string
        }"
      `)
    })

    it('nullish property with optionalType=undefined adds | undefined', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'undefined', arrayType: 'array', enumType: 'inlineLiteral' })
      const result = p.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string', nullish: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @type string | undefined
           */
          tag: string | undefined
        }"
      `)
    })

    it('property with description adds @description JSDoc comment', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'name', schema: createSchema({ type: 'string', description: 'The user name' }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @description The user name
           * @type string | undefined
           */
          name?: string
        }"
      `)
    })

    it('property with deprecated flag adds @deprecated JSDoc comment', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'oldField', schema: createSchema({ type: 'string', deprecated: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @deprecated
           * @type string | undefined
           */
          oldField?: string
        }"
      `)
    })

    it('property with min/max adds Minimum/Maximum length JSDoc comments', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'code', schema: createSchema({ type: 'string', min: 2, max: 10 }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @minLength 2
           * @maxLength 10
           * @type string | undefined
           */
          code?: string
        }"
      `)
    })

    it('property with default adds @default JSDoc comment', async () => {
      const result = printer.transform(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'count', schema: createSchema({ type: 'number', default: 0 }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          /**
           * @default 0
           * @type number | undefined
           */
          count?: number
        }"
      `)
    })
  })

  describe('print', () => {
    it('without typeName returns raw type string', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'inlineLiteral' })
      const result = p.print(createSchema({ type: 'string' }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "string
        "
      `)
    })

    it('with typeName wraps in export type declaration', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'inlineLiteral', name: 'MyType' })
      const result = p.print(createSchema({ type: 'string' }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "/**
         * @type string
         */
        export type MyType = string
        "
      `)
    })

    it('with typeName and object uses interface syntax by default', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'inlineLiteral', name: 'MyObject' })
      const result = p.print(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'id', schema: createSchema({ type: 'number' }) })],
        }),
      )

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "/**
         * @type object
         */
        export type MyObject = {
          /**
           * @type number | undefined
           */
          id?: number
        }
        "
      `)
    })

    it('with syntaxType=type forces type alias even for objects', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enumType: 'inlineLiteral',
        name: 'MyObject',
        syntaxType: 'type',
      })
      const result = p.print(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'id', schema: createSchema({ type: 'number' }) })],
        }),
      )

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "/**
         * @type object
         */
        export type MyObject = {
          /**
           * @type number | undefined
           */
          id?: number
        }
        "
      `)
    })

    it('nullable node adds | null to the declaration', async () => {
      const p = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'inlineLiteral', name: 'Status' })
      const result = p.print(createSchema({ type: 'string', nullable: true }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "/**
         * @type string
         */
        export type Status = string | null
        "
      `)
    })

    it('optional node with optionalType=undefined adds | undefined to the declaration', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'undefined',
        arrayType: 'array',
        enumType: 'inlineLiteral',
        name: 'MaybeValue',
      })
      const result = p.print(createSchema({ type: 'string', optional: true }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "/**
         * @type string | undefined
         */
        export type MaybeValue = string | undefined
        "
      `)
    })

    it('with description adds @description JSDoc to the declaration', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enumType: 'inlineLiteral',
        name: 'Described',
        description: 'A well-described type',
      })
      const result = p.print(createSchema({ type: 'string' }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "/**
         * @description A well-described type
         * @type string
         */
        export type Described = string
        "
      `)
    })

    it('with keysToOmit wraps in Omit<Type, Keys>', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enumType: 'inlineLiteral',
        name: 'Partial',
        keysToOmit: ['id', 'createdAt'],
      })
      const result = p.print(
        createSchema({
          type: 'object',
          properties: [
            createProperty({ name: 'id', schema: createSchema({ type: 'number' }) }),
            createProperty({ name: 'name', schema: createSchema({ type: 'string' }) }),
            createProperty({ name: 'createdAt', schema: createSchema({ type: 'string' }) }),
          ],
        }),
      )

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "/**
         * @type object
         */
        export type Partial = Omit<
          NonNullable<{
            /**
             * @type number | undefined
             */
            id?: number
            /**
             * @type string | undefined
             */
            name?: string
            /**
             * @type string | undefined
             */
            createdAt?: string
          }>,
          'id' | 'createdAt'
        >
        "
      `)
    })

    it('with keysToOmit and optional ref appends | undefined after Omit', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enumType: 'inlineLiteral',
        name: 'AddFiles200',
        keysToOmit: ['name'],
      })
      const result = p.print(createSchema({ type: 'ref', name: 'Pet', optional: true }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type AddFiles200 = Omit<NonNullable<Pet>, 'name'> | undefined
        "
      `)
    })

    it('with keysToOmit and nullable ref appends | null after Omit', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enumType: 'inlineLiteral',
        name: 'AddFiles200',
        keysToOmit: ['name'],
      })
      const result = p.print(createSchema({ type: 'ref', name: 'Pet', nullable: true }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type AddFiles200 = Omit<NonNullable<Pet>, 'name'> | null
        "
      `)
    })

    it('named optional ref always adds | undefined regardless of optionalType', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enumType: 'inlineLiteral',
        name: 'AddFilesMutationRequest',
      })
      const result = p.print(createSchema({ type: 'ref', name: 'Pet', optional: true }))

      expect(await format(result ?? '')).toMatchInlineSnapshot(`
        "export type AddFilesMutationRequest = Pet | undefined
        "
      `)
    })
  })

  describe('nodes override', () => {
    it('overrides a single node type', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enumType: 'inlineLiteral',
        nodes: { date: () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) },
      })
      expect(await formatTS(p.transform(createSchema({ type: 'date', representation: 'string' })))).toBe('string')
    })

    it('override does not affect other node types', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enumType: 'inlineLiteral',
        nodes: { date: () => ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword) },
      })
      expect(await formatTS(p.transform(createSchema({ type: 'number' })))).toBe('number')
    })

    it('override can call this.transform for nested nodes', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enumType: 'inlineLiteral',
        nodes: {
          array(node) {
            const itemNodes = (node.items ?? []).map((item) => this.transform(item)).filter(Boolean) as ts.TypeNode[]
            return ts.factory.createTypeReferenceNode('Set', [ts.factory.createUnionTypeNode(itemNodes)])
          },
        },
      })
      const node = createSchema({ type: 'array', items: [createSchema({ type: 'string' })] })
      expect(await formatTS(p.transform(node))).toBe('Set<string>')
    })

    it('override can read this.options', async () => {
      const p = printerTs({
        resolver: resolverTs,
        optionalType: 'questionToken',
        arrayType: 'array',
        enumType: 'inlineLiteral',
        syntaxType: 'type',
        nodes: {
          string() {
            return this.options.syntaxType === 'interface'
              ? ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword)
              : ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
          },
        },
      })
      expect(await formatTS(p.transform(createSchema({ type: 'string' })))).toBe('string')
    })
  })
})
