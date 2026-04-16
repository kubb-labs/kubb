import { ast } from '@kubb/core'
import { describe, expect, test } from 'vitest'
import { printerZod } from './printerZod.ts'

describe('printerZod', () => {
  const printer = printerZod({})

  describe('scalar types', () => {
    test('any', () => {
      expect(printer.print(ast.createSchema({ type: 'any' }))).toBe('z.any()')
    })

    test('unknown', () => {
      expect(printer.print(ast.createSchema({ type: 'unknown' }))).toBe('z.unknown()')
    })

    test('void', () => {
      expect(printer.print(ast.createSchema({ type: 'void' }))).toBe('z.void()')
    })

    test('boolean', () => {
      expect(printer.print(ast.createSchema({ type: 'boolean' }))).toBe('z.boolean()')
    })

    test('null', () => {
      expect(printer.print(ast.createSchema({ type: 'null' }))).toBe('z.null()')
    })
  })

  describe('string', () => {
    test('basic string', () => {
      expect(printer.print(ast.createSchema({ type: 'string' }))).toBe('z.string()')
    })

    test('string with coercion', () => {
      const p = printerZod({ coercion: { strings: true } })
      expect(p.print(ast.createSchema({ type: 'string' }))).toBe('z.coerce.string()')
    })

    test('string with pattern', () => {
      expect(printer.print(ast.createSchema({ type: 'string', pattern: '^\\d+$' }))).toBe('z.string().regex(/^\\d+$/)')
    })

    test('string with min, max, and pattern', () => {
      expect(printer.print(ast.createSchema({ type: 'string', min: 1, max: 10, pattern: '^[a-z]+$' }))).toBe('z.string().min(1).max(10).regex(/^[a-z]+$/)')
    })
  })

  describe('number', () => {
    test('basic number', () => {
      expect(printer.print(ast.createSchema({ type: 'number' }))).toBe('z.number()')
    })

    test('number with coercion', () => {
      const p = printerZod({ coercion: { numbers: true } })
      expect(p.print(ast.createSchema({ type: 'number' }))).toBe('z.coerce.number()')
    })

    test('number with multipleOf', () => {
      expect(printer.print(ast.createSchema({ type: 'number', multipleOf: 5 }))).toBe('z.number().multipleOf(5)')
    })

    test('integer with min, max, and multipleOf', () => {
      expect(printer.print(ast.createSchema({ type: 'integer', min: 0, max: 100, multipleOf: 10 }))).toBe('z.int().min(0).max(100).multipleOf(10)')
    })
  })

  describe('integer', () => {
    test('basic integer', () => {
      expect(printer.print(ast.createSchema({ type: 'integer' }))).toBe('z.int()')
    })

    test('integer with coercion', () => {
      const p = printerZod({ coercion: { numbers: true } })
      expect(p.print(ast.createSchema({ type: 'integer' }))).toBe('z.coerce.number().int()')
    })
  })

  describe('bigint', () => {
    test('basic bigint', () => {
      expect(printer.print(ast.createSchema({ type: 'bigint' }))).toBe('z.bigint()')
    })

    test('bigint with coercion', () => {
      const p = printerZod({ coercion: { numbers: true } })
      expect(p.print(ast.createSchema({ type: 'bigint' }))).toBe('z.coerce.bigint()')
    })
  })

  describe('date types', () => {
    test('date (JS Date)', () => {
      expect(printer.print(ast.createSchema({ type: 'date', representation: 'date' }))).toBe('z.date()')
    })

    test('date (ISO string)', () => {
      expect(printer.print(ast.createSchema({ type: 'date', representation: 'string' }))).toBe('z.iso.date()')
    })

    test('datetime', () => {
      expect(printer.print(ast.createSchema({ type: 'datetime' }))).toBe('z.iso.datetime()')
    })

    test('time (ISO string)', () => {
      expect(printer.print(ast.createSchema({ type: 'time', representation: 'string' }))).toBe('z.iso.time()')
    })
  })

  describe('special string formats', () => {
    test('uuid', () => {
      expect(printer.print(ast.createSchema({ type: 'uuid' }))).toBe('z.uuid()')
    })

    test('guid', () => {
      const p = printerZod({ guidType: 'guid' })
      expect(p.print(ast.createSchema({ type: 'uuid' }))).toBe('z.guid()')
    })

    test('email', () => {
      expect(printer.print(ast.createSchema({ type: 'email' }))).toBe('z.email()')
    })

    test('url', () => {
      expect(printer.print(ast.createSchema({ type: 'url' }))).toBe('z.url()')
    })

    test('ipv4', () => {
      expect(printer.print(ast.createSchema({ type: 'ipv4' }))).toBe('z.ipv4()')
    })

    test('ipv6', () => {
      expect(printer.print(ast.createSchema({ type: 'ipv6' }))).toBe('z.ipv6()')
    })
  })

  describe('enum', () => {
    test('string enum', () => {
      const result = printer.print(ast.createSchema({ type: 'enum', enumValues: ['a', 'b', 'c'] }))
      expect(result).toBe(`z.enum(["a", "b", "c"])`)
    })

    test('number enum', () => {
      const result = printer.print(ast.createSchema({ type: 'enum', enumValues: [200, 400, 500] }))
      expect(result).toBe('z.enum([200, 400, 500])')
    })

    test('boolean enum', () => {
      const result = printer.print(ast.createSchema({ type: 'enum', enumValues: [true, false] }))
      expect(result).toBe('z.enum([true, false])')
    })

    test('number literals (namedEnumValues)', () => {
      const result = printer.print(
        ast.createSchema({
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
        ast.createSchema({
          type: 'enum',
          namedEnumValues: [{ name: 'Active', value: true, primitive: 'boolean' }],
        }),
      )
      expect(result).toBe('z.literal(true)')
    })
  })

  describe('object', () => {
    test('basic object', () => {
      const node = ast.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer' }) }),
          ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
        ],
      })
      expect(printer.print(node)).toBe('z.object({\n    "id": z.int(),\n    "name": z.string()\n    })')
    })

    test('object with additionalProperties: true → .catchall(z.unknown())', () => {
      const node = ast.createSchema({ type: 'object', primitive: 'object', properties: [], additionalProperties: true })
      expect(printer.print(node)).toBe('z.object({\n    \n    }).catchall(z.unknown())')
    })

    test('object with additionalProperties: false → .strict()', () => {
      const node = ast.createSchema({ type: 'object', primitive: 'object', properties: [], additionalProperties: false })
      expect(printer.print(node)).toBe('z.object({\n    \n    }).strict()')
    })

    test('object with additionalProperties schema → .catchall(schema)', () => {
      const node = ast.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [],
        additionalProperties: ast.createSchema({ type: 'string' }),
      })
      expect(printer.print(node)).toBe('z.object({\n    \n    }).catchall(z.string())')
    })
  })

  describe('array', () => {
    test('basic array', () => {
      const node = ast.createSchema({
        type: 'array',
        items: [ast.createSchema({ type: 'string' })],
      })
      expect(printer.print(node)).toBe('z.array(z.string())')
    })
  })

  describe('ref', () => {
    test('cross-file ref returns bare name', () => {
      const node = ast.createSchema({ type: 'ref', name: 'UnsupportedAuthenticationProblem', ref: '#/components/schemas/Problem' })

      expect(printer.print(node)).toBe('Problem')
    })

    test('cross-file ref with resolver returns resolved bare name', () => {
      const p = printerZod({ resolver: { default: (name: string) => `${name.charAt(0).toLowerCase()}${name.slice(1)}Schema` } as any })
      const node = ast.createSchema({ type: 'ref', name: 'UnsupportedAuthenticationProblem', ref: '#/components/schemas/Problem' })

      expect(p.print(node)).toBe('problemSchema')
    })

    test('ref without $ref path (intersection chaining) returns bare name', () => {
      const node = ast.createSchema({ type: 'ref', name: 'PhoneNumber' })

      expect(printer.print(node)).toBe('PhoneNumber')
    })

    test('self-ref wraps in z.lazy()', () => {
      const p = printerZod({ schemaName: 'TreeNode' })
      const node = ast.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' })

      expect(p.print(node)).toBe('z.lazy(() => TreeNode)')
    })

    test('object cross-file ref property uses bare name (no getter)', () => {
      const node = ast.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.createProperty({
            name: 'category',
            required: false,
            schema: ast.createSchema({ type: 'ref', name: 'Category', ref: '#/components/schemas/Category' }),
          }),
          ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
        ],
      })

      expect(printer.print(node)).toBe('z.object({\n    "category": Category.optional(),\n    "name": z.string()\n    })')
    })

    test('object self-ref property uses getter with bare name', () => {
      const p = printerZod({ schemaName: 'TreeNode' })
      const node = ast.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.createProperty({
            name: 'children',
            required: false,
            schema: ast.createSchema({ type: 'ref', name: 'TreeNode', ref: '#/components/schemas/TreeNode' }),
          }),
          ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
        ],
      })

      expect(p.print(node)).toBe('z.object({\n    get "children"() { return TreeNode.optional() },\n    "name": z.string()\n    })')
    })
  })

  describe('intersection', () => {
    test('ref with string maxLength constraint', () => {
      const node = ast.createSchema({
        type: 'intersection',
        members: [ast.createSchema({ type: 'ref', name: 'PhoneNumber' }), ast.createSchema({ type: 'string', max: 15 })],
      })
      expect(printer.print(node)).toBe('PhoneNumber.max(15)')
    })

    test('ref with string min and max constraints', () => {
      const node = ast.createSchema({
        type: 'intersection',
        members: [ast.createSchema({ type: 'ref', name: 'PhoneNumber' }), ast.createSchema({ type: 'string', min: 10, max: 15 })],
      })
      expect(printer.print(node)).toBe('PhoneNumber.min(10).max(15)')
    })

    test('ref with string pattern constraint', () => {
      const node = ast.createSchema({
        type: 'intersection',
        members: [ast.createSchema({ type: 'ref', name: 'Token' }), ast.createSchema({ type: 'string', pattern: '^[A-Z]+$' })],
      })
      expect(printer.print(node)).toBe('Token.regex(/^[A-Z]+$/)')
    })

    test('ref with number min/max constraints', () => {
      const node = ast.createSchema({
        type: 'intersection',
        members: [ast.createSchema({ type: 'ref', name: 'Score' }), ast.createSchema({ type: 'number', min: 0, max: 100 })],
      })
      expect(printer.print(node)).toBe('Score.min(0).max(100)')
    })

    test('two complex members fall back to .and()', () => {
      const node = ast.createSchema({
        type: 'intersection',
        members: [ast.createSchema({ type: 'string' }), ast.createSchema({ type: 'number' })],
      })
      expect(printer.print(node)).toBe('z.string().and(z.number())')
    })

    test('single member', () => {
      const node = ast.createSchema({
        type: 'intersection',
        members: [ast.createSchema({ type: 'string' })],
      })
      expect(printer.print(node)).toBe('z.string()')
    })
  })

  describe('union', () => {
    test('basic union', () => {
      const node = ast.createSchema({
        type: 'union',
        members: [ast.createSchema({ type: 'string' }), ast.createSchema({ type: 'number' })],
      })
      expect(printer.print(node)).toBe('z.union([z.string(), z.number()])')
    })

    test('single member union', () => {
      const node = ast.createSchema({
        type: 'union',
        members: [ast.createSchema({ type: 'string' })],
      })
      expect(printer.print(node)).toBe('z.string()')
    })

    test('discriminated union', () => {
      const node = ast.createSchema({
        type: 'union',
        discriminatorPropertyName: 'petType',
        members: [
          ast.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }),
          ast.createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }),
        ],
      })
      expect(printer.print(node)).toBe('z.discriminatedUnion("petType", [Cat, Dog])')
    })

    test('discriminated union with single member', () => {
      const node = ast.createSchema({
        type: 'union',
        discriminatorPropertyName: 'type',
        members: [ast.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' })],
      })
      expect(printer.print(node)).toBe('Cat')
    })

    test('discriminated union with object members', () => {
      const node = ast.createSchema({
        type: 'union',
        discriminatorPropertyName: 'status',
        members: [
          ast.createSchema({
            type: 'object',
            primitive: 'object',
            properties: [
              ast.createProperty({ name: 'status', required: true, schema: ast.createSchema({ type: 'enum', enumValues: ['active'] }) }),
              ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
            ],
          }),
          ast.createSchema({
            type: 'object',
            primitive: 'object',
            properties: [
              ast.createProperty({ name: 'status', required: true, schema: ast.createSchema({ type: 'enum', enumValues: ['inactive'] }) }),
              ast.createProperty({ name: 'reason', required: true, schema: ast.createSchema({ type: 'string' }) }),
            ],
          }),
        ],
      })
      expect(printer.print(node)).toBe(
        'z.discriminatedUnion("status", [z.object({\n    "status": z.enum(["active"]),\n    "name": z.string()\n    }), z.object({\n    "status": z.enum(["inactive"]),\n    "reason": z.string()\n    })])',
      )
    })

    test('falls back to z.union when a member is an intersection', () => {
      const node = ast.createSchema({
        type: 'union',
        discriminatorPropertyName: 'petType',
        members: [
          ast.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }),
          ast.createSchema({
            type: 'intersection',
            members: [
              ast.createSchema({ type: 'ref', name: 'BasePet', ref: '#/components/schemas/BasePet' }),
              ast.createSchema({
                type: 'object',
                primitive: 'object',
                properties: [ast.createProperty({ name: 'petType', required: true, schema: ast.createSchema({ type: 'string' }) })],
              }),
            ],
          }),
        ],
      })
      expect(printer.print(node)).toBe('z.union([Cat, BasePet.and(z.object({\n    "petType": z.string()\n    }))])')
    })

    test('discriminated union with three or more ref members', () => {
      const node = ast.createSchema({
        type: 'union',
        discriminatorPropertyName: 'type',
        members: [
          ast.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }),
          ast.createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }),
          ast.createSchema({ type: 'ref', name: 'Bird', ref: '#/components/schemas/Bird' }),
        ],
      })
      expect(printer.print(node)).toBe('z.discriminatedUnion("type", [Cat, Dog, Bird])')
    })

    test('empty discriminated union returns empty string', () => {
      const node = ast.createSchema({
        type: 'union',
        discriminatorPropertyName: 'type',
        members: [],
      })
      expect(printer.print(node)).toBeNull()
    })
  })

  describe('modifiers', () => {
    test('nullable', () => {
      const node = ast.createSchema({ type: 'string', nullable: true })
      expect(printer.print(node)).toBe('z.string().nullable()')
    })

    test('optional', () => {
      const node = ast.createSchema({ type: 'string', optional: true })
      expect(printer.print(node)).toBe('z.string().optional()')
    })

    test('nullish', () => {
      const node = ast.createSchema({ type: 'string', nullish: true })
      expect(printer.print(node)).toBe('z.string().nullish()')
    })
  })

  describe('coercion', () => {
    test('boolean coercion enables all', () => {
      const p = printerZod({ coercion: true })
      expect(p.print(ast.createSchema({ type: 'string' }))).toBe('z.coerce.string()')
      expect(p.print(ast.createSchema({ type: 'number' }))).toBe('z.coerce.number()')
    })

    test('granular coercion', () => {
      const p = printerZod({ coercion: { strings: true, numbers: false } })
      expect(p.print(ast.createSchema({ type: 'string' }))).toBe('z.coerce.string()')
      expect(p.print(ast.createSchema({ type: 'number' }))).toBe('z.number()')
    })
  })

  describe('keysToOmit', () => {
    test('omits single key from object schema', () => {
      const p = printerZod({ keysToOmit: ['id'] })
      const node = ast.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer' }) }),
          ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
        ],
      })
      expect(p.print(node)).toBe('z.object({\n    "id": z.int(),\n    "name": z.string()\n    }).omit({ "id": true })')
    })

    test('omits multiple keys from object schema', () => {
      const p = printerZod({ keysToOmit: ['id', 'createdAt'] })
      const node = ast.createSchema({
        type: 'object',
        primitive: 'object',
        properties: [
          ast.createProperty({ name: 'id', required: true, schema: ast.createSchema({ type: 'integer' }) }),
          ast.createProperty({ name: 'createdAt', required: true, schema: ast.createSchema({ type: 'string' }) }),
          ast.createProperty({ name: 'name', required: true, schema: ast.createSchema({ type: 'string' }) }),
        ],
      })
      expect(p.print(node)).toBe(
        'z.object({\n    "id": z.int(),\n    "createdAt": z.string(),\n    "name": z.string()\n    }).omit({ "id": true, "createdAt": true })',
      )
    })

    test('no omit when keysToOmit is empty', () => {
      const p = printerZod({ keysToOmit: [] })
      const node = ast.createSchema({ type: 'string' })
      expect(p.print(node)).toBe('z.string()')
    })

    test('skips omit for discriminated union', () => {
      const p = printerZod({ keysToOmit: ['petType'] })
      const node = ast.createSchema({
        type: 'union',
        primitive: 'object',
        discriminatorPropertyName: 'petType',
        members: [
          ast.createSchema({ type: 'ref', name: 'Cat', ref: '#/components/schemas/Cat' }),
          ast.createSchema({ type: 'ref', name: 'Dog', ref: '#/components/schemas/Dog' }),
        ],
      })
      expect(p.print(node)).toBe('z.discriminatedUnion("petType", [Cat, Dog])')
    })
  })

  describe('nodes override', () => {
    test('overrides a single node type', () => {
      const p = printerZod({ nodes: { date: () => 'z.string().date()' } })
      expect(p.print(ast.createSchema({ type: 'date', representation: 'string' }))).toBe('z.string().date()')
    })

    test('override does not affect other node types', () => {
      const p = printerZod({ nodes: { date: () => 'z.string().date()' } })
      expect(p.print(ast.createSchema({ type: 'string' }))).toBe('z.string()')
    })

    test('override can call this.transform for nested nodes', () => {
      const p = printerZod({
        nodes: {
          array(node) {
            const inner = node.items?.map((item) => this.transform(item)).join(', ') ?? 'z.unknown()'
            return `z.set(${inner})`
          },
        },
      })
      const node = ast.createSchema({ type: 'array', items: [ast.createSchema({ type: 'string' })] })
      expect(p.print(node)).toBe('z.set(z.string())')
    })

    test('override can read this.options', () => {
      const p = printerZod({
        coercion: true,
        nodes: {
          string() {
            return this.options.coercion ? 'z.coerce.string().custom()' : 'z.string()'
          },
        },
      })
      expect(p.print(ast.createSchema({ type: 'string' }))).toBe('z.coerce.string().custom()')
    })
  })
})
