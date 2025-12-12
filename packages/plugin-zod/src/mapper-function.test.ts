import { schemaKeywords } from '@kubb/plugin-oas'
import * as parserZod from './parser.ts'

describe('zod mapper function support', () => {
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

    const text = parserZod.parse(
      {
        name: 'test',
        schema: {},
        parent: undefined,
        current: schema,
        siblings: [schema],
      },
      {
        version: '3',
        mapper: {
          status: 'z.enum(["active", "inactive"])',
        },
      },
    )

    expect(text).toContain('"status": z.enum(["active", "inactive"])')
  })

  test('function mapper with schema access', () => {
    const schemaObject = {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          'x-error-message': 'Invalid email format',
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

    const text = parserZod.parse(
      {
        name: 'test',
        schema: schemaObject,
        parent: undefined,
        current: schema,
        siblings: [schema],
      },
      {
        version: '3',
        mapper: {
          email: (schema, defaultOutput) => {
            const errorMsg = schema?.['x-error-message']
            if (errorMsg) {
              // Replace .email() with .email({ message: "..." })
              return defaultOutput.replace('.email()', `.email({ message: "${errorMsg}" })`)
            }
            return defaultOutput
          },
        },
      },
    )

    expect(text).toContain('.email({ message: "Invalid email format" })')
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

    const text = parserZod.parse(
      {
        name: 'test',
        schema: schemaObject,
        parent: undefined,
        current: schema,
        siblings: [schema],
      },
      {
        version: '3',
        mapper: {
          email: (schema, defaultOutput) => {
            const errorMsg = schema?.['x-error-message']
            if (errorMsg) {
              return defaultOutput.replace('.email()', `.email({ message: "${errorMsg}" })`)
            }
            return defaultOutput
          },
        },
      },
    )

    // Should return default output without modification
    expect(text).toContain('.email()')
    expect(text).not.toContain('message:')
  })
})
