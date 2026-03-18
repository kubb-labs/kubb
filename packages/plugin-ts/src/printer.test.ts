import { createProperty, createSchema } from '@kubb/ast'
import { print } from '@kubb/fabric-core/parsers/typescript'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { format } from '#mocks'
import { printerTs } from './printer.ts'

/**
 * Wraps a `ts.TypeNode` in `type _ = <node>` so prettier can parse it as a
 * valid TypeScript statement, then strips the wrapper from the result.
 */
const formatTS = async (node: ts.TypeNode | null | undefined): Promise<string> => {
  if (!node) return ''

  const alias = ts.factory.createTypeAliasDeclaration(undefined, '_', undefined, node)
  const source = print(alias)
  const formatted = await format(source)

  return formatted
    .replace(/^type _ = /, '')
    .replace(/;\s*$/, '')
    .trim()
}

describe('printerTs', () => {
  const printer = printerTs({
    optionalType: 'questionToken',
    arrayType: 'array',
    enumType: 'inlineLiteral',
  })

  describe('scalar types', () => {
    it('any', async () => {
      const result = printer.printType(createSchema({ type: 'any' }))

      expect(await formatTS(result)).toBe('any')
    })

    it('unknown', async () => {
      const result = printer.printType(createSchema({ type: 'unknown' }))

      expect(await formatTS(result)).toBe('unknown')
    })

    it('void', async () => {
      const result = printer.printType(createSchema({ type: 'void' }))

      expect(await formatTS(result)).toBe('void')
    })

    it('boolean', async () => {
      const result = printer.printType(createSchema({ type: 'boolean' }))

      expect(await formatTS(result)).toBe('boolean')
    })

    it('null', async () => {
      const result = printer.printType(createSchema({ type: 'null' }))

      expect(await formatTS(result)).toBe('null')
    })

    it('string', async () => {
      const result = printer.printType(createSchema({ type: 'string' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('uuid', async () => {
      const result = printer.printType(createSchema({ type: 'uuid' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('email', async () => {
      const result = printer.printType(createSchema({ type: 'email' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('url', async () => {
      const result = printer.printType(createSchema({ type: 'url' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('datetime', async () => {
      const result = printer.printType(createSchema({ type: 'datetime' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('number', async () => {
      const result = printer.printType(createSchema({ type: 'number' }))

      expect(await formatTS(result)).toBe('number')
    })

    it('integer', async () => {
      const result = printer.printType(createSchema({ type: 'integer' }))

      expect(await formatTS(result)).toBe('number')
    })

    it('bigint', async () => {
      const result = printer.printType(createSchema({ type: 'bigint' }))

      expect(await formatTS(result)).toBe('bigint')
    })

    it('blob', async () => {
      const result = printer.printType(createSchema({ type: 'blob' }))

      expect(await formatTS(result)).toBe('Blob')
    })
  })

  describe('date / time', () => {
    it('date with representation=date returns Date', async () => {
      const result = printer.printType(createSchema({ type: 'date', representation: 'date' }))

      expect(await formatTS(result)).toBe('Date')
    })

    it('date without date representation returns string', async () => {
      const result = printer.printType(createSchema({ type: 'date', representation: 'string' }))

      expect(await formatTS(result)).toBe('string')
    })

    it('time with representation=date returns Date', async () => {
      const result = printer.printType(createSchema({ type: 'time', representation: 'date' }))

      expect(await formatTS(result)).toBe('Date')
    })

    it('time without date representation returns string', async () => {
      const result = printer.printType(createSchema({ type: 'time', representation: 'string' }))

      expect(await formatTS(result)).toBe('string')
    })
  })

  describe('ref', () => {
    it('ref with name returns type reference', async () => {
      const result = printer.printType(createSchema({ type: 'ref', name: 'MyType' }))

      expect(await formatTS(result)).toBe('MyType')
    })

    it('ref without name returns undefined', () => {
      const result = printer.printType(createSchema({ type: 'ref' }))

      expect(result).toBeUndefined()
    })
  })

  describe('enum', () => {
    it('inlineLiteral (default) renders literal union', async () => {
      const result = printer.printType(createSchema({ type: 'enum', enumValues: ['a', 'b', 'c'] }))

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'a' | 'b' | 'c'"`)
    })

    it('inlineLiteral with mixed types', async () => {
      const result = printer.printType(createSchema({ type: 'enum', enumValues: ['x', 1, true] }))

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'x' | 1 | true"`)
    })

    it('enum without name still renders inline literal even when enumType is not inlineLiteral', async () => {
      const p = printerTs({ optionalType: 'questionToken', arrayType: 'array', enumType: 'enum' })
      const result = p.print(createSchema({ type: 'enum', enumValues: ['a', 'b'] }))

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'a' | 'b'"`)
    })

    it('enum with name and enumType=enum renders reference', async () => {
      const p = printerTs({ optionalType: 'questionToken', arrayType: 'array', enumType: 'enum' })
      const result = p.print(createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('Status')
    })

    it('enum with name and enumType=asConst renders reference with Key suffix', async () => {
      const p = printerTs({ optionalType: 'questionToken', arrayType: 'array', enumType: 'asConst' })
      const result = p.print(createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('StatusKey')
    })

    it('enum with name and enumType=asPascalConst renders reference with Key suffix', async () => {
      const p = printerTs({ optionalType: 'questionToken', arrayType: 'array', enumType: 'asPascalConst' })
      const result = p.print(createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('StatusKey')
    })

    it('enum with name and enumType=literal renders reference', async () => {
      const p = printerTs({ optionalType: 'questionToken', arrayType: 'array', enumType: 'literal' })
      const result = p.print(createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('Status')
    })

    it('enum with name and enumType=constEnum renders reference without Key suffix', async () => {
      const p = printerTs({ optionalType: 'questionToken', arrayType: 'array', enumType: 'constEnum' })
      const result = p.print(createSchema({ type: 'enum', name: 'Status', enumValues: ['active', 'inactive'] }))

      expect(await formatTS(result)).toBe('Status')
    })

    it('namedEnumValues are used when provided', async () => {
      const result = printer.printType(
        createSchema({
          type: 'enum',
          namedEnumValues: [
            { name: 'Active', value: 'active', format: 'string' },
            { name: 'Inactive', value: 'inactive', format: 'string' },
          ],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'active' | 'inactive'"`)
    })

    it('namedEnumValues take precedence over enumValues', async () => {
      const result = printer.printType(
        createSchema({
          type: 'enum',
          namedEnumValues: [{ name: 'Yes', value: 1, format: 'number' }],
          enumValues: ['ignored'],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"1"`)
    })
  })

  describe('union', () => {
    it('renders a union of members', async () => {
      const result = printer.printType(
        createSchema({
          type: 'union',
          members: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
        }),
      )

      expect(await formatTS(result)).toBe('string | number')
    })

    it('renders nested union', async () => {
      const result = printer.printType(
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
      const result = printer.printType(
        createSchema({
          type: 'union',
          members: [createSchema({ type: 'enum', enumType: 'string', enumValues: ['test'] }), createSchema({ type: 'email' })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"'test' | (string & {})"`)
    })
  })

  describe('intersection', () => {
    it('renders an intersection of members', async () => {
      const result = printer.printType(
        createSchema({
          type: 'intersection',
          members: [
            createSchema({ type: 'object', properties: [createProperty({ name: 'a', schema: createSchema({ type: 'string' }) })] }),
            createSchema({ type: 'object', properties: [createProperty({ name: 'b', schema: createSchema({ type: 'number' }) })] }),
          ],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          a: string
        } & {
          b: number
        }"
      `)
    })
  })

  describe('array', () => {
    it('arrayType=array renders T[]', async () => {
      const result = printer.printType(
        createSchema({
          type: 'array',
          items: [createSchema({ type: 'string' })],
        }),
      )

      expect(await formatTS(result)).toBe('string[]')
    })

    it('arrayType=generic renders Array<T>', async () => {
      const p = printerTs({ optionalType: 'questionToken', arrayType: 'generic', enumType: 'inlineLiteral' })
      const result = p.print(
        createSchema({
          type: 'array',
          items: [createSchema({ type: 'number' })],
        }),
      )

      expect(await formatTS(result)).toBe('Array<number>')
    })

    it('renders array with multiple item types as union', async () => {
      const result = printer.printType(
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
      const result = printer.printType(
        createSchema({
          type: 'tuple',
          items: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
        }),
      )

      expect(await formatTS(result)).toBe('[string, number]')
    })

    it('renders tuple with rest element', async () => {
      const result = printer.printType(
        createSchema({
          type: 'tuple',
          items: [createSchema({ type: 'string' })],
          rest: createSchema({ type: 'number' }),
        }),
      )

      expect(await formatTS(result)).toBe('[string, ...number[]]')
    })

    it('renders tuple with min — optional items after min', async () => {
      const result = printer.printType(
        createSchema({
          type: 'tuple',
          items: [createSchema({ type: 'string' }), createSchema({ type: 'number' }), createSchema({ type: 'boolean' })],
          min: 1,
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`"[string, number?, boolean?]"`)
    })

    it('renders tuple with max — items truncated to max', async () => {
      const result = printer.printType(
        createSchema({
          type: 'tuple',
          items: [createSchema({ type: 'string' }), createSchema({ type: 'number' }), createSchema({ type: 'boolean' })],
          max: 2,
        }),
      )

      expect(await formatTS(result)).toBe('[string, number]')
    })

    it('renders tuple with max and rest — fills up to max with rest type', async () => {
      const result = printer.printType(
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
      const result = printer.printType(createSchema({ type: 'object' }))

      expect(await formatTS(result)).toBe('object')
    })

    it('renders object with properties', async () => {
      const result = printer.printType(
        createSchema({
          type: 'object',
          properties: [
            createProperty({ name: 'id', schema: createSchema({ type: 'number' }) }),
            createProperty({ name: 'name', schema: createSchema({ type: 'string' }) }),
          ],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          id: number
          name: string
        }"
      `)
    })

    it('optional property with optionalType=questionToken', async () => {
      const result = printer.printType(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string', optional: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          tag?: string
        }"
      `)
    })

    it('optional property with optionalType=undefined adds | undefined', async () => {
      const p = printerTs({ optionalType: 'undefined', arrayType: 'array', enumType: 'inlineLiteral' })
      const result = p.print(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string', optional: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          tag: string | undefined
        }"
      `)
    })

    it('optional property with optionalType=questionTokenAndUndefined adds both', async () => {
      const p = printerTs({ optionalType: 'questionTokenAndUndefined', arrayType: 'array', enumType: 'inlineLiteral' })
      const result = p.print(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string', optional: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          tag?: string | undefined
        }"
      `)
    })

    it('nullable property adds | null', async () => {
      const result = printer.printType(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'value', schema: createSchema({ type: 'string', nullable: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          value: string | null
        }"
      `)
    })

    it('readonly property', async () => {
      const result = printer.printType(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'id', schema: createSchema({ type: 'number', readOnly: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          readonly id: number
        }"
      `)
    })

    it('additionalProperties=true adds index signature of unknown', async () => {
      const result = printer.printType(
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
      const result = printer.printType(
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
      const result = printer.printType(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'id', schema: createSchema({ type: 'number' }) })],
          additionalProperties: createSchema({ type: 'string' }),
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          id: number
          [key: string]: unknown
        }"
      `)
    })

    it('patternProperties adds index signature', async () => {
      const result = printer.printType(
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
      const result = printer.printType(
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
      const result = printer.printType(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string', nullish: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          tag?: string
        }"
      `)
    })

    it('nullish property with optionalType=undefined adds | undefined', async () => {
      const p = printerTs({ optionalType: 'undefined', arrayType: 'array', enumType: 'inlineLiteral' })
      const result = p.print(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'tag', schema: createSchema({ type: 'string', nullish: true }) })],
        }),
      )

      expect(await formatTS(result)).toMatchInlineSnapshot(`
        "{
          tag: string | undefined
        }"
      `)
    })

    it('property with description adds @description JSDoc comment', async () => {
      const result = printer.printType(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'name', schema: createSchema({ type: 'string', description: 'The user name' }) })],
        }),
      )

      const output = await formatTS(result)

      expect(output).toContain('@description The user name')
    })

    it('property with deprecated flag adds @deprecated JSDoc comment', async () => {
      const result = printer.printType(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'oldField', schema: createSchema({ type: 'string', deprecated: true }) })],
        }),
      )

      const output = await formatTS(result)

      expect(output).toContain('@deprecated')
    })

    it('property with min/max adds @minLength/@maxLength JSDoc comments', async () => {
      const result = printer.printType(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'code', schema: createSchema({ type: 'string', min: 2, max: 10 }) })],
        }),
      )

      const output = await formatTS(result)

      expect(output).toContain('@minLength 2')
      expect(output).toContain('@maxLength 10')
    })

    it('property with default adds @default JSDoc comment', async () => {
      const result = printer.printType(
        createSchema({
          type: 'object',
          properties: [createProperty({ name: 'count', schema: createSchema({ type: 'number', default: 0 }) })],
        }),
      )

      const output = await formatTS(result)

      expect(output).toContain('@default 0')
    })
  })
})
