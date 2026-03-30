import { createProperty, createSchema } from '@kubb/ast'
import { describe, expect, test } from 'vitest'
import { printerZodMini } from './printerZodMini.ts'

describe('printerZodMini', () => {
  const printer = printerZodMini({})

  describe('scalar types', () => {
    test('any', () => {
      expect(printer.print(createSchema({ type: 'any' }))).toBe('z.any()')
    })

    test('unknown', () => {
      expect(printer.print(createSchema({ type: 'unknown' }))).toBe('z.unknown()')
    })

    test('void', () => {
      expect(printer.print(createSchema({ type: 'void' }))).toBe('z.void()')
    })

    test('boolean', () => {
      expect(printer.print(createSchema({ type: 'boolean' }))).toBe('z.boolean()')
    })

    test('null', () => {
      expect(printer.print(createSchema({ type: 'null' }))).toBe('z.null()')
    })
  })

  describe('string', () => {
    test('basic string', () => {
      expect(printer.print(createSchema({ type: 'string' }))).toBe('z.string()')
    })

    test('string with length checks', () => {
      expect(printer.print(createSchema({ type: 'string', min: 1, max: 10 }))).toBe('z.string().check(z.minLength(1), z.maxLength(10))')
    })

    test('string with pattern', () => {
      expect(printer.print(createSchema({ type: 'string', pattern: '^\\d+$' }))).toBe('z.string().check(z.regex(/^\\d+$/))')
    })

    test('string with min, max, and pattern', () => {
      expect(printer.print(createSchema({ type: 'string', min: 1, max: 10, pattern: '^[a-z]+$' }))).toBe(
        'z.string().check(z.minLength(1), z.maxLength(10), z.regex(/^[a-z]+$/))',
      )
    })
  })

  describe('number', () => {
    test('basic number', () => {
      expect(printer.print(createSchema({ type: 'number' }))).toBe('z.number()')
    })

    test('number with numeric checks', () => {
      expect(printer.print(createSchema({ type: 'number', min: 0, max: 100 }))).toBe('z.number().check(z.minimum(0), z.maximum(100))')
    })
  })

  describe('integer', () => {
    test('basic integer', () => {
      expect(printer.print(createSchema({ type: 'integer' }))).toBe('z.int()')
    })
  })

  describe('bigint', () => {
    test('basic bigint (no coercion in mini)', () => {
      expect(printer.print(createSchema({ type: 'bigint' }))).toBe('z.bigint()')
    })
  })

  describe('date types', () => {
    test('date (JS Date)', () => {
      expect(printer.print(createSchema({ type: 'date', representation: 'date' }))).toBe('z.date()')
    })

    test('date (ISO string)', () => {
      expect(printer.print(createSchema({ type: 'date', representation: 'string' }))).toBe('z.iso.date()')
    })

    test('datetime falls back to z.string()', () => {
      expect(printer.print(createSchema({ type: 'datetime' }))).toBe('z.string()')
    })

    test('time (ISO string)', () => {
      expect(printer.print(createSchema({ type: 'time', representation: 'string' }))).toBe('z.iso.time()')
    })
  })

  describe('special string formats', () => {
    test('uuid', () => {
      expect(printer.print(createSchema({ type: 'uuid' }))).toBe('z.uuid()')
    })

    test('guid', () => {
      const p = printerZodMini({ guidType: 'guid' })
      expect(p.print(createSchema({ type: 'uuid' }))).toBe('z.guid()')
    })

    test('email', () => {
      expect(printer.print(createSchema({ type: 'email' }))).toBe('z.email()')
    })

    test('url', () => {
      expect(printer.print(createSchema({ type: 'url' }))).toBe('z.url()')
    })
  })

  describe('enum', () => {
    test('string enum', () => {
      const result = printer.print(createSchema({ type: 'enum', enumValues: ['a', 'b', 'c'] }))
      expect(result).toBe(`z.enum(["a", "b", "c"])`)
    })

    test('number enum', () => {
      const result = printer.print(createSchema({ type: 'enum', enumValues: [200, 400, 500] }))
      expect(result).toBe('z.enum([200, 400, 500])')
    })

    test('boolean enum', () => {
      const result = printer.print(createSchema({ type: 'enum', enumValues: [true, false] }))
      expect(result).toBe('z.enum([true, false])')
    })

    test('number literals (namedEnumValues)', () => {
      const result = printer.print(
        createSchema({
          type: 'enum',
          namedEnumValues: [
            { name: 'Ok', value: 200, primitive: 'number' },
            { name: 'BadRequest', value: 400, primitive: 'number' },
          ],
        }),
      )
      expect(result).toBe('z.union([z.literal(200), z.literal(400)])')
    })

    test('boolean literal (namedEnumValues)', () => {
      const result = printer.print(
        createSchema({
          type: 'enum',
          namedEnumValues: [{ name: 'Active', value: true, primitive: 'boolean' }],
        }),
      )
      expect(result).toBe('z.literal(true)')
    })
  })

  describe('object', () => {
    test('basic object', () => {
      const node = createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          createProperty({ name: 'id', required: true, schema: createSchema({ type: 'integer' }) }),
          createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) }),
        ],
      })
      const result = printer.print(node)
      expect(result).toBe('z.object({\n    "id": z.int(),\n    "name": z.string()\n    })')
    })
  })

  describe('array', () => {
    test('basic array', () => {
      const node = createSchema({
        type: 'array',
        items: [createSchema({ type: 'string' })],
      })
      expect(printer.print(node)).toBe('z.array(z.string())')
    })
  })

  describe('modifiers (functional syntax)', () => {
    test('nullable', () => {
      const node = createSchema({ type: 'string', nullable: true })
      expect(printer.print(node)).toBe('z.nullable(z.string())')
    })

    test('optional', () => {
      const node = createSchema({ type: 'string', optional: true })
      expect(printer.print(node)).toBe('z.optional(z.string())')
    })

    test('nullish', () => {
      const node = createSchema({ type: 'string', nullish: true })
      expect(printer.print(node)).toBe('z.nullish(z.string())')
    })

    test('nullable and optional wraps both', () => {
      const node = createSchema({ type: 'string', nullable: true, optional: true })
      expect(printer.print(node)).toBe('z.optional(z.nullable(z.string()))')
    })
  })

  describe('default (functional syntax)', () => {
    test('string default', () => {
      const node = createSchema({ type: 'string', default: 'hello' })
      expect(printer.print(node)).toBe('z._default(z.string(), "hello")')
    })

    test('number default', () => {
      const node = createSchema({ type: 'number', default: 42 })
      expect(printer.print(node)).toBe('z._default(z.number(), 42)')
    })
  })

  describe('intersection', () => {
    test('ref with string maxLength constraint', () => {
      const node = createSchema({
        type: 'intersection',
        members: [createSchema({ type: 'ref', name: 'PhoneNumber' }), createSchema({ type: 'string', max: 15 })],
      })
      expect(printer.print(node)).toBe('PhoneNumber.check(z.maxLength(15))')
    })

    test('ref with string min and max constraints', () => {
      const node = createSchema({
        type: 'intersection',
        members: [createSchema({ type: 'ref', name: 'PhoneNumber' }), createSchema({ type: 'string', min: 10, max: 15 })],
      })
      expect(printer.print(node)).toBe('PhoneNumber.check(z.minLength(10), z.maxLength(15))')
    })

    test('ref with string pattern constraint', () => {
      const node = createSchema({
        type: 'intersection',
        members: [createSchema({ type: 'ref', name: 'Token' }), createSchema({ type: 'string', pattern: '^[A-Z]+$' })],
      })
      expect(printer.print(node)).toBe('Token.check(z.regex(/^[A-Z]+$/))')
    })

    test('ref with number min/max constraints', () => {
      const node = createSchema({
        type: 'intersection',
        members: [createSchema({ type: 'ref', name: 'Score' }), createSchema({ type: 'number', min: 0, max: 100 })],
      })
      expect(printer.print(node)).toBe('Score.check(z.minimum(0), z.maximum(100))')
    })

    test('two complex members fall back to z.intersection()', () => {
      const node = createSchema({
        type: 'intersection',
        members: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
      })
      expect(printer.print(node)).toBe('z.intersection(z.string(), z.number())')
    })

    test('single member', () => {
      const node = createSchema({
        type: 'intersection',
        members: [createSchema({ type: 'string' })],
      })
      expect(printer.print(node)).toBe('z.string()')
    })
  })

  describe('keysToOmit', () => {
    test('omits single key from object schema', () => {
      const p = printerZodMini({ keysToOmit: ['id'] })
      const node = createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          createProperty({ name: 'id', required: true, schema: createSchema({ type: 'integer' }) }),
          createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) }),
        ],
      })
      expect(p.print(node)).toBe('z.object({\n    "id": z.int(),\n    "name": z.string()\n    }).omit({ "id": true })')
    })

    test('omits multiple keys from object schema', () => {
      const p = printerZodMini({ keysToOmit: ['id', 'createdAt'] })
      const node = createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          createProperty({ name: 'id', required: true, schema: createSchema({ type: 'integer' }) }),
          createProperty({ name: 'createdAt', required: true, schema: createSchema({ type: 'string' }) }),
          createProperty({ name: 'name', required: true, schema: createSchema({ type: 'string' }) }),
        ],
      })
      expect(p.print(node)).toBe(
        'z.object({\n    "id": z.int(),\n    "createdAt": z.string(),\n    "name": z.string()\n    }).omit({ "id": true, "createdAt": true })',
      )
    })

    test('no omit when keysToOmit is empty', () => {
      const p = printerZodMini({ keysToOmit: [] })
      const node = createSchema({ type: 'string' })
      expect(p.print(node)).toBe('z.string()')
    })
  })
})
