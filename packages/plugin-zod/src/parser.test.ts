import { schemaKeywords } from '@kubb/plugin-oas'
import { schemas } from '@kubb/plugin-oas/mocks'
import { describe, expect, test } from 'vitest'
import * as parserZod from './parser.ts'

describe('zod parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserZod.parse(
      {
        name,
        schema: {},
        parent: undefined,
        current: schema,
        siblings: [schema],
      },
      { version: '3' },
    )
    expect(text).toMatchSnapshot()
  })

  test.each(schemas.basic)('$name v4', ({ name, schema }) => {
    const text = parserZod.parse(
      {
        name,
        schema: {},
        parent: undefined,
        current: schema,
        siblings: [schema],
      },
      { version: '4' },
    )
    expect(text).toMatchSnapshot()
  })

  describe('coercion with version 4', () => {
    test('uuid with coercion=true and version=4 should skip coercion', () => {
      const schema = { keyword: schemaKeywords.uuid, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', coercion: true },
      )
      expect(text).toBe('z.uuid()')
    })

    test('uuid with coercion=true and version=3 should use z.coerce.string().uuid()', () => {
      const schema = { keyword: schemaKeywords.uuid, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '3', coercion: true },
      )
      expect(text).toBe('z.coerce.string().uuid()')
    })

    test('url with coercion=true and version=4 should skip coercion', () => {
      const schema = { keyword: schemaKeywords.url, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', coercion: true },
      )
      expect(text).toBe('z.url()')
    })

    test('url with coercion=true and version=3 should use z.coerce.string().url()', () => {
      const schema = { keyword: schemaKeywords.url, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '3', coercion: true },
      )
      expect(text).toBe('z.coerce.string().url()')
    })

    test('email with coercion=true and version=4 should skip coercion', () => {
      const schema = { keyword: schemaKeywords.email, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', coercion: true },
      )
      expect(text).toBe('z.email()')
    })

    test('email with coercion=true and version=3 should use z.coerce.string().email()', () => {
      const schema = { keyword: schemaKeywords.email, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '3', coercion: true },
      )
      expect(text).toBe('z.coerce.string().email()')
    })

    test('uuid without coercion and version=4 should use z.uuid()', () => {
      const schema = { keyword: schemaKeywords.uuid, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', coercion: false },
      )
      expect(text).toBe('z.uuid()')
    })

    test('uuid without coercion and version=3 should use z.string().uuid()', () => {
      const schema = { keyword: schemaKeywords.uuid, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '3', coercion: false },
      )
      expect(text).toBe('z.string().uuid()')
    })
  })

  describe('mini mode', () => {
    test('string with min/max should use .check() syntax', () => {
      const schema = { keyword: schemaKeywords.string, args: undefined }
      const minSchema = { keyword: schemaKeywords.min, args: 5 }
      const maxSchema = { keyword: schemaKeywords.max, args: 100 }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema, minSchema, maxSchema],
        },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.string().check(z.minLength(5), z.maxLength(100))')
    })

    test('string without min/max should use z.string()', () => {
      const schema = { keyword: schemaKeywords.string, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.string()')
    })

    test('number with min/max should use .check() syntax', () => {
      const schema = { keyword: schemaKeywords.number, args: undefined }
      const minSchema = { keyword: schemaKeywords.min, args: 0 }
      const maxSchema = { keyword: schemaKeywords.max, args: 100 }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema, minSchema, maxSchema],
        },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.number().check(z.minimum(0), z.maximum(100))')
    })

    test('integer should use z.int()', () => {
      const schema = { keyword: schemaKeywords.integer, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.int()')
    })

    test('array with min/max should use .check() syntax', () => {
      const schema = {
        keyword: schemaKeywords.array,
        args: {
          items: [{ keyword: schemaKeywords.string, args: undefined }],
          min: 1,
          max: 10,
        },
      }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.array(z.string()).check(z.minLength(1), z.maxLength(10))')
    })

    test('email should use z.email()', () => {
      const schema = { keyword: schemaKeywords.email, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.email()')
    })

    test('url should use z.url()', () => {
      const schema = { keyword: schemaKeywords.url, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.url()')
    })

    test('uuid should use z.uuid()', () => {
      const schema = { keyword: schemaKeywords.uuid, args: undefined }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.uuid()')
    })

    test('matches should use z.string().check(z.regex())', () => {
      const schema = { keyword: schemaKeywords.matches, args: '^test$' }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.string().check(z.regex(/^test$/))')
    })

    test('integer with exclusive bounds should use .check() with exclusive option', () => {
      const schema = { keyword: schemaKeywords.integer, args: undefined }
      const exclusiveMinSchema = {
        keyword: schemaKeywords.exclusiveMinimum,
        args: 0,
      }
      const exclusiveMaxSchema = {
        keyword: schemaKeywords.exclusiveMaximum,
        args: 100,
      }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema, exclusiveMinSchema, exclusiveMaxSchema],
        },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.int().check(z.minimum(0, { exclusive: true }), z.maximum(100, { exclusive: true }))')
    })

    test('object with nullish property should use functional wrapper z.nullish() in mini mode', () => {
      const schema = {
        keyword: schemaKeywords.object,
        args: {
          properties: {
            email: [
              { keyword: schemaKeywords.string, args: undefined },
              { keyword: schemaKeywords.nullish, args: undefined },
            ],
          },
        },
      }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', mini: true },
      )
      expect(text).toContain('z.nullish(z.string())')
      expect(text).not.toContain('.nullish()')
    })

    test('object with optional property should use functional wrapper z.optional() in mini mode', () => {
      const schema = {
        keyword: schemaKeywords.object,
        args: {
          properties: {
            name: [
              { keyword: schemaKeywords.string, args: undefined },
              { keyword: schemaKeywords.optional, args: undefined },
            ],
          },
        },
      }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', mini: true },
      )
      expect(text).toContain('z.optional(z.string())')
      expect(text).not.toContain('.optional()')
    })

    test('object with nullable property should use functional wrapper z.nullable() in mini mode', () => {
      const schema = {
        keyword: schemaKeywords.object,
        args: {
          properties: {
            age: [
              { keyword: schemaKeywords.number, args: undefined },
              { keyword: schemaKeywords.nullable, args: undefined },
            ],
          },
        },
      }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4', mini: true },
      )
      expect(text).toContain('z.nullable(z.number())')
      expect(text).not.toContain('.nullable()')
    })
  })

  describe('pattern with length constraints', () => {
    test('matches with min/max should include length constraints (version 3)', () => {
      const schema = {
        keyword: schemaKeywords.matches,
        args: '^[A-Za-z0-9]+$',
      }
      const minSchema = { keyword: schemaKeywords.min, args: 5 }
      const maxSchema = { keyword: schemaKeywords.max, args: 19 }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema, minSchema, maxSchema],
        },
        { version: '3' },
      )
      expect(text).toBe('z.string().min(5).max(19).regex(/^[A-Za-z0-9]+$/)')
    })

    test('matches with min/max should include length constraints (version 4)', () => {
      const schema = {
        keyword: schemaKeywords.matches,
        args: '^[A-Za-z0-9]+$',
      }
      const minSchema = { keyword: schemaKeywords.min, args: 5 }
      const maxSchema = { keyword: schemaKeywords.max, args: 19 }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema, minSchema, maxSchema],
        },
        { version: '4' },
      )
      expect(text).toBe('z.string().min(5).max(19).regex(/^[A-Za-z0-9]+$/)')
    })

    test('matches with min/max should include length constraints (mini mode)', () => {
      const schema = {
        keyword: schemaKeywords.matches,
        args: '^[A-Za-z0-9]+$',
      }
      const minSchema = { keyword: schemaKeywords.min, args: 5 }
      const maxSchema = { keyword: schemaKeywords.max, args: 19 }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema, minSchema, maxSchema],
        },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.string().check(z.minLength(5), z.maxLength(19), z.regex(/^[A-Za-z0-9]+$/))')
    })

    test('matches with only min should include min constraint', () => {
      const schema = { keyword: schemaKeywords.matches, args: '^[A-Z]+$' }
      const minSchema = { keyword: schemaKeywords.min, args: 3 }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema, minSchema],
        },
        { version: '4' },
      )
      expect(text).toBe('z.string().min(3).regex(/^[A-Z]+$/)')
    })

    test('matches with only max should include max constraint', () => {
      const schema = { keyword: schemaKeywords.matches, args: '^[0-9]+$' }
      const maxSchema = { keyword: schemaKeywords.max, args: 10 }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema, maxSchema],
        },
        { version: '4' },
      )
      expect(text).toBe('z.string().max(10).regex(/^[0-9]+$/)')
    })

    test('matches without min/max should work as before', () => {
      const schema = { keyword: schemaKeywords.matches, args: '^test$' }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4' },
      )
      expect(text).toBe('z.string().regex(/^test$/)')
    })
  })

  describe('default value handling', () => {
    test('default with value 0 should work correctly', () => {
      const schema = { keyword: schemaKeywords.default, args: 0 }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4' },
      )
      expect(text).toBe('.default(0)')
    })

    test('default with value false should work correctly', () => {
      const schema = { keyword: schemaKeywords.default, args: false }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4' },
      )
      expect(text).toBe('.default(false)')
    })

    test('default with empty string should work correctly', () => {
      const schema = { keyword: schemaKeywords.default, args: '' }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4' },
      )
      expect(text).toBe(".default('')")
    })

    test('default with string value should work correctly', () => {
      const schema = { keyword: schemaKeywords.default, args: 'test' }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4' },
      )
      expect(text).toBe('.default(test)')
    })

    test('default without args should work correctly', () => {
      const schema = { keyword: schemaKeywords.default }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '4' },
      )
      expect(text).toBe('.default()')
    })
  })

  describe('array of enums', () => {
    test('array with enum items should wrap enum in z.array()', () => {
      const schema = {
        keyword: schemaKeywords.array,
        args: {
          items: [
            {
              keyword: schemaKeywords.enum,
              args: {
                name: 'TestArrayEnum',
                typeName: 'TestArrayEnum',
                asConst: false,
                items: [
                  { name: '"foo"', value: 'foo', format: 'string' },
                  { name: '"bar"', value: 'bar', format: 'string' },
                  { name: '"baz"', value: 'baz', format: 'string' },
                ],
              },
            },
          ],
          unique: false,
        },
      }
      const text = parserZod.parse(
        {
          name: 'test',
          schema: {},
          parent: undefined,
          current: schema,
          siblings: [schema],
        },
        { version: '3' },
      )
      expect(text).toBe('z.array(z.enum(["foo", "bar", "baz"]))')
    })
  })
})
