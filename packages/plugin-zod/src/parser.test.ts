import { schemaKeywords } from '@kubb/plugin-oas'
import { schemas } from '@kubb/plugin-oas/mocks'
import * as parserZod from './parser.ts'

describe('zod parse', () => {
  test.each(schemas.basic)('$name', ({ name, schema }) => {
    const text = parserZod.parse({ name, schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '3' })
    expect(text).toMatchSnapshot()
  })

  test.each(schemas.basic)('$name v4', ({ name, schema }) => {
    const text = parserZod.parse({ name, schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '4' })
    expect(text).toMatchSnapshot()
  })

  describe('coercion with version 4', () => {
    test('uuid with coercion=true and version=4 should skip coercion', () => {
      const schema = { keyword: schemaKeywords.uuid, args: undefined }
      const text = parserZod.parse({ name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '4', coercion: true })
      expect(text).toBe('z.uuid()')
    })

    test('uuid with coercion=true and version=3 should use z.coerce.string().uuid()', () => {
      const schema = { keyword: schemaKeywords.uuid, args: undefined }
      const text = parserZod.parse({ name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '3', coercion: true })
      expect(text).toBe('z.coerce.string().uuid()')
    })

    test('url with coercion=true and version=4 should skip coercion', () => {
      const schema = { keyword: schemaKeywords.url, args: undefined }
      const text = parserZod.parse({ name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '4', coercion: true })
      expect(text).toBe('z.url()')
    })

    test('url with coercion=true and version=3 should use z.coerce.string().url()', () => {
      const schema = { keyword: schemaKeywords.url, args: undefined }
      const text = parserZod.parse({ name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '3', coercion: true })
      expect(text).toBe('z.coerce.string().url()')
    })

    test('email with coercion=true and version=4 should skip coercion', () => {
      const schema = { keyword: schemaKeywords.email, args: undefined }
      const text = parserZod.parse({ name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '4', coercion: true })
      expect(text).toBe('z.email()')
    })

    test('email with coercion=true and version=3 should use z.coerce.string().email()', () => {
      const schema = { keyword: schemaKeywords.email, args: undefined }
      const text = parserZod.parse({ name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '3', coercion: true })
      expect(text).toBe('z.coerce.string().email()')
    })

    test('uuid without coercion and version=4 should use z.uuid()', () => {
      const schema = { keyword: schemaKeywords.uuid, args: undefined }
      const text = parserZod.parse({ name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '4', coercion: false })
      expect(text).toBe('z.uuid()')
    })

    test('uuid without coercion and version=3 should use z.string().uuid()', () => {
      const schema = { keyword: schemaKeywords.uuid, args: undefined }
      const text = parserZod.parse({ name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '3', coercion: false })
      expect(text).toBe('z.string().uuid()')
    })
  })

  describe('mini mode', () => {
    test('string with min/max should use .check() syntax', () => {
      const schema = { keyword: schemaKeywords.string, args: undefined }
      const minSchema = { keyword: schemaKeywords.min, args: 5 }
      const maxSchema = { keyword: schemaKeywords.max, args: 100 }
      const text = parserZod.parse(
        { name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema, minSchema, maxSchema] },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.string().check(z.minLength(5), z.maxLength(100))')
    })

    test('string without min/max should use z.string()', () => {
      const schema = { keyword: schemaKeywords.string, args: undefined }
      const text = parserZod.parse({ name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '4', mini: true })
      expect(text).toBe('z.string()')
    })

    test('number with min/max should use .check() syntax', () => {
      const schema = { keyword: schemaKeywords.number, args: undefined }
      const minSchema = { keyword: schemaKeywords.min, args: 0 }
      const maxSchema = { keyword: schemaKeywords.max, args: 100 }
      const text = parserZod.parse(
        { name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema, minSchema, maxSchema] },
        { version: '4', mini: true },
      )
      expect(text).toBe('z.number().check(z.minimum(0), z.maximum(100))')
    })

    test('integer should use z.int()', () => {
      const schema = { keyword: schemaKeywords.integer, args: undefined }
      const text = parserZod.parse({ name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '4', mini: true })
      expect(text).toBe('z.int()')
    })

    test('array with min/max should use .check() syntax', () => {
      const schema = { keyword: schemaKeywords.array, args: { items: [{ keyword: schemaKeywords.string, args: undefined }], min: 1, max: 10 } }
      const text = parserZod.parse({ name: 'test', schema: {}, parent: undefined, current: schema, siblings: [schema] }, { version: '4', mini: true })
      expect(text).toBe('z.array(z.string()).check(z.minLength(1), z.maxLength(10))')
    })
  })
})
