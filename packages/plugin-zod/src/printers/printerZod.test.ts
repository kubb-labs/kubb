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

    test('object with mapper', () => {
      const p = printerZod({ mapper: { name: 'z.string().email()' } })
      const node = createSchema({
        type: 'object',
        properties: [
          { name: 'name', required: true, schema: createSchema({ type: 'string' }) },
        ],
      })
      const result = p.print(node)
      expect(result).toContain('"name": z.string().email()')
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

  describe('mini mode', () => {
    const miniPrinter = printerZod({ mini: true })

    test('nullable', () => {
      const node = createSchema({ type: 'string', nullable: true })
      expect(miniPrinter.print(node)).toBe('z.nullable(z.string())')
    })

    test('optional', () => {
      const node = createSchema({ type: 'string', optional: true })
      expect(miniPrinter.print(node)).toBe('z.optional(z.string())')
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
