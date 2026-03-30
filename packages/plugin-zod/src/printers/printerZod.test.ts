import { createSchema } from '@kubb/ast'
import { describe, expect, test } from 'vitest'
import { printerZod } from './printerZod.ts'

describe('printerZod', () => {
  const printer = printerZod({})

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

    test('string with coercion', () => {
      const p = printerZod({ coercion: { strings: true } })
      expect(p.print(createSchema({ type: 'string' }))).toBe('z.coerce.string()')
    })

    test('string with pattern', () => {
      expect(printer.print(createSchema({ type: 'string', pattern: '^\\d+$' }))).toBe('z.string().regex(new RegExp("^\\\\d+$"))')
    })

    test('string with min, max, and pattern', () => {
      expect(printer.print(createSchema({ type: 'string', min: 1, max: 10, pattern: '^[a-z]+$' }))).toBe(
        'z.string().min(1).max(10).regex(new RegExp("^[a-z]+$"))',
      )
    })
  })

  describe('number', () => {
    test('basic number', () => {
      expect(printer.print(createSchema({ type: 'number' }))).toBe('z.number()')
    })

    test('number with coercion', () => {
      const p = printerZod({ coercion: { numbers: true } })
      expect(p.print(createSchema({ type: 'number' }))).toBe('z.coerce.number()')
    })
  })

  describe('integer', () => {
    test('basic integer', () => {
      expect(printer.print(createSchema({ type: 'integer' }))).toBe('z.int()')
    })

    test('integer with coercion', () => {
      const p = printerZod({ coercion: { numbers: true } })
      expect(p.print(createSchema({ type: 'integer' }))).toBe('z.coerce.number().int()')
    })
  })

  describe('bigint', () => {
    test('basic bigint', () => {
      expect(printer.print(createSchema({ type: 'bigint' }))).toBe('z.bigint()')
    })

    test('bigint with coercion', () => {
      const p = printerZod({ coercion: { numbers: true } })
      expect(p.print(createSchema({ type: 'bigint' }))).toBe('z.coerce.bigint()')
    })
  })

  describe('date types', () => {
    test('date (JS Date)', () => {
      expect(printer.print(createSchema({ type: 'date', representation: 'date' }))).toBe('z.date()')
    })

    test('date (ISO string)', () => {
      expect(printer.print(createSchema({ type: 'date', representation: 'string' }))).toBe('z.iso.date()')
    })

    test('datetime', () => {
      expect(printer.print(createSchema({ type: 'datetime' }))).toBe('z.iso.datetime()')
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
      const p = printerZod({ guidType: 'guid' })
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
        properties: [
          { name: 'id', required: true, schema: createSchema({ type: 'integer' }) },
          { name: 'name', required: true, schema: createSchema({ type: 'string' }) },
        ],
      })
      const result = printer.print(node)
      expect(result).toContain('z.object(')
      expect(result).toContain('"id": z.int()')
      expect(result).toContain('"name": z.string()')
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

  describe('union', () => {
    test('basic union', () => {
      const node = createSchema({
        type: 'union',
        members: [createSchema({ type: 'string' }), createSchema({ type: 'number' })],
      })
      expect(printer.print(node)).toBe('z.union([z.string(), z.number()])')
    })

    test('single member union', () => {
      const node = createSchema({
        type: 'union',
        members: [createSchema({ type: 'string' })],
      })
      expect(printer.print(node)).toBe('z.string()')
    })
  })

  describe('modifiers', () => {
    test('nullable', () => {
      const node = createSchema({ type: 'string', nullable: true })
      expect(printer.print(node)).toBe('z.string().nullable()')
    })

    test('optional', () => {
      const node = createSchema({ type: 'string', optional: true })
      expect(printer.print(node)).toBe('z.string().optional()')
    })

    test('nullish', () => {
      const node = createSchema({ type: 'string', nullish: true })
      expect(printer.print(node)).toBe('z.string().nullish()')
    })
  })

  describe('coercion', () => {
    test('boolean coercion enables all', () => {
      const p = printerZod({ coercion: true })
      expect(p.print(createSchema({ type: 'string' }))).toBe('z.coerce.string()')
      expect(p.print(createSchema({ type: 'number' }))).toBe('z.coerce.number()')
    })

    test('granular coercion', () => {
      const p = printerZod({ coercion: { strings: true, numbers: false } })
      expect(p.print(createSchema({ type: 'string' }))).toBe('z.coerce.string()')
      expect(p.print(createSchema({ type: 'number' }))).toBe('z.number()')
    })
  })
})
