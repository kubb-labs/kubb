import { createSchema } from '@kubb/ast'
import { describe, expect, test } from 'vitest'
import { zodExprFromSchemaNode } from './utils.ts'

describe('zodExprFromSchemaNode', () => {
  test('string → z.string()', () => {
    expect(zodExprFromSchemaNode(createSchema({ type: 'string' }))).toBe('z.string()')
  })

  test('integer → z.coerce.number()', () => {
    expect(zodExprFromSchemaNode(createSchema({ type: 'integer' }))).toBe('z.coerce.number()')
  })

  test('number → z.number()', () => {
    expect(zodExprFromSchemaNode(createSchema({ type: 'number' }))).toBe('z.number()')
  })

  test('boolean → z.boolean()', () => {
    expect(zodExprFromSchemaNode(createSchema({ type: 'boolean' }))).toBe('z.boolean()')
  })

  test('array → z.array(z.unknown())', () => {
    expect(zodExprFromSchemaNode(createSchema({ type: 'array' }))).toBe('z.array(z.unknown())')
  })

  test('enum with string values → z.enum([...])', () => {
    const schema = createSchema({ type: 'enum', enumValues: ['PENDING', 'APPROVED', 'REJECTED'] })
    expect(zodExprFromSchemaNode(schema)).toBe("z.enum([\"PENDING\", \"APPROVED\", \"REJECTED\"])")
  })

  test('enum with namedEnumValues (string) → z.enum([...])', () => {
    const schema = createSchema({
      type: 'enum',
      namedEnumValues: [
        { name: 'PENDING', value: 'PENDING', format: 'string' },
        { name: 'APPROVED', value: 'APPROVED', format: 'string' },
      ],
    })
    expect(zodExprFromSchemaNode(schema)).toBe("z.enum([\"PENDING\", \"APPROVED\"])")
  })

  test('enum with number values → z.union([z.literal(...)])', () => {
    const schema = createSchema({
      type: 'enum',
      enumType: 'number',
      namedEnumValues: [
        { name: '1', value: 1, format: 'number' },
        { name: '2', value: 2, format: 'number' },
      ],
    })
    expect(zodExprFromSchemaNode(schema)).toBe('z.union([z.literal(1), z.literal(2)])')
  })

  test('enum with boolean values → z.union([z.literal(...)])', () => {
    const schema = createSchema({
      type: 'enum',
      enumType: 'boolean',
      namedEnumValues: [
        { name: 'true', value: true, format: 'boolean' },
        { name: 'false', value: false, format: 'boolean' },
      ],
    })
    expect(zodExprFromSchemaNode(schema)).toBe('z.union([z.literal(true), z.literal(false)])')
  })

  test('enum with empty values → z.string()', () => {
    expect(zodExprFromSchemaNode(createSchema({ type: 'enum', enumValues: [] }))).toBe('z.string()')
  })

  test('nullable string → z.string().nullable()', () => {
    expect(zodExprFromSchemaNode(createSchema({ type: 'string', nullable: true }))).toBe('z.string().nullable()')
  })

  test('nullable integer → z.coerce.number().nullable()', () => {
    expect(zodExprFromSchemaNode(createSchema({ type: 'integer', nullable: true }))).toBe('z.coerce.number().nullable()')
  })

  test('nullable number → z.number().nullable()', () => {
    expect(zodExprFromSchemaNode(createSchema({ type: 'number', nullable: true }))).toBe('z.number().nullable()')
  })

  test('nullable boolean → z.boolean().nullable()', () => {
    expect(zodExprFromSchemaNode(createSchema({ type: 'boolean', nullable: true }))).toBe('z.boolean().nullable()')
  })

  test('nullable array → z.array(z.unknown()).nullable()', () => {
    expect(zodExprFromSchemaNode(createSchema({ type: 'array', nullable: true }))).toBe('z.array(z.unknown()).nullable()')
  })

  test('nullable enum → z.enum([...]).nullable()', () => {
    const schema = createSchema({ type: 'enum', enumValues: ['A', 'B'], nullable: true })
    expect(zodExprFromSchemaNode(schema)).toBe('z.enum(["A", "B"]).nullable()')
  })
})
