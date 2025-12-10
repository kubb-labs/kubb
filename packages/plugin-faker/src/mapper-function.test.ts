import { schemaKeywords } from '@kubb/plugin-oas'
import * as parserFaker from './parser.ts'

describe('faker mapper function support', () => {
  test('string mapper (backward compatible)', () => {
    const schema = {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          status: [{ keyword: schemaKeywords.string }],
        },
        additionalProperties: [],
      },
    }

    const text = parserFaker.parse(
      {
        name: 'test',
        schema: {},
        parent: undefined,
        current: schema,
        siblings: [schema],
      },
      {
        typeName: 'Test',
        canOverride: true,
        mapper: {
          status: `faker.helpers.arrayElement(['active', 'inactive'])`,
        },
      },
    )

    expect(text).toContain(`"status": faker.helpers.arrayElement(['active', 'inactive'])`)
  })

  test('function mapper with schema access', () => {
    const schemaObject = {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          'x-custom-pattern': '/^[a-z]+@example\\.com$/',
        },
      },
    }

    const schema = {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          email: [{ keyword: schemaKeywords.email }],
        },
        additionalProperties: [],
      },
    }

    const text = parserFaker.parse(
      {
        name: 'test',
        schema: schemaObject,
        parent: undefined,
        current: schema,
        siblings: [schema],
      },
      {
        typeName: 'Test',
        canOverride: true,
        mapper: {
          email: (schema, defaultOutput) => {
            const pattern = schema?.['x-custom-pattern']
            return pattern ? `faker.helpers.fromRegExp(new RegExp(${pattern}))` : defaultOutput
          },
        },
      },
    )

    expect(text).toContain('"email": faker.helpers.fromRegExp(new RegExp(/^[a-z]+@example\\.com$/))')
  })

  test('function mapper returns default when no custom attribute', () => {
    const schemaObject = {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
        },
      },
    }

    const schema = {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          email: [{ keyword: schemaKeywords.email }],
        },
        additionalProperties: [],
      },
    }

    const text = parserFaker.parse(
      {
        name: 'test',
        schema: schemaObject,
        parent: undefined,
        current: schema,
        siblings: [schema],
      },
      {
        typeName: 'Test',
        canOverride: true,
        mapper: {
          email: (schema, defaultOutput) => {
            const pattern = schema?.['x-custom-pattern']
            return pattern ? `faker.helpers.fromRegExp(new RegExp(${pattern}))` : defaultOutput
          },
        },
      },
    )

    expect(text).toContain('"email": faker.internet.email()')
  })
})
