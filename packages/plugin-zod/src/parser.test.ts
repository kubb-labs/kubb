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
})
