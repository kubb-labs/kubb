import pathParser from 'node:path'
import { parseZodMeta, zodParser } from './zodParser.ts'
import { oasPathParser, type OpenAPIV3 } from '@kubb/swagger'
import { ZodGenerator } from '@kubb/swagger-zod'

const input = [
  {
    input: parseZodMeta({
      keyword: 'string',
    }),
    expected: 'z.string()',
  },
  {
    input: parseZodMeta({
      keyword: 'number',
    }),
    expected: 'z.number()',
  },
  {
    input: parseZodMeta({
      keyword: 'boolean',
    }),
    expected: 'z.boolean()',
  },
  {
    input: parseZodMeta({
      keyword: 'any',
    }),
    expected: 'z.any()',
  },
  {
    input: parseZodMeta({
      keyword: 'null',
    }),
    expected: '.nullable()',
  },
  {
    input: parseZodMeta({
      keyword: 'undefined',
    }),
    expected: 'z.undefined()',
  },
  {
    input: parseZodMeta({
      keyword: 'min',
      args: 2,
    }),
    expected: '.min(2)',
  },
  {
    input: parseZodMeta({
      keyword: 'max',
      args: 2,
    }),
    expected: '.max(2)',
  },
  {
    input: parseZodMeta({
      keyword: 'matches',
      args: '*',
    }),
    expected: '.regex(*)',
  },
  {
    input: parseZodMeta({
      keyword: 'ref',
      args: 'Pet',
    }),
    expected: 'z.lazy(() => Pet).schema',
  },
  {
    input: parseZodMeta({
      keyword: 'enum',
      args: ['"A"', '"B"', '"C"', 2],
    }),
    expected: 'z.enum(["A","B","C",2])',
  },

  {
    input: parseZodMeta({
      keyword: 'tuple',
      args: [],
    }),
    expected: 'z.tuple([])',
  },
  {
    input: parseZodMeta({
      keyword: 'tuple',
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    }),
    expected: 'z.tuple([z.string(),z.number()])',
  },

  {
    input: parseZodMeta({
      keyword: 'array',
      args: [],
    }),
    expected: 'z.array()',
  },
  {
    input: parseZodMeta({
      keyword: 'array',
      args: [{ keyword: 'ref', args: 'Pet' }],
    }),
    expected: 'z.array(z.lazy(() => Pet).schema)',
  },

  {
    input: parseZodMeta({
      keyword: 'union',
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    }),
    expected: 'z.union([z.string(),z.number()])',
  },
  {
    input: parseZodMeta({
      keyword: 'union',
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    }),
    expected: 'z.union([z.string(),z.number()])',
  },
  {
    input: parseZodMeta({
      keyword: 'union',
      args: [{ keyword: 'string' }],
    }),
    expected: 'z.string()',
  },

  {
    input: parseZodMeta({
      keyword: 'catchall',
      args: [],
    }),
    expected: '.catchall()',
  },
  {
    input: parseZodMeta({
      keyword: 'catchall',
      args: [{ keyword: 'ref', args: 'Pet' }],
    }),
    expected: '.catchall(z.lazy(() => Pet).schema)',
  },

  {
    input: parseZodMeta({
      keyword: 'and',
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    }),
    expected: 'z.string().and(z.number())',
  },

  {
    input: parseZodMeta({
      keyword: 'object',
      args: {
        firstName: [{ keyword: 'string' }, { keyword: 'min', args: 2 }],
        address: [{ keyword: 'string' }, { keyword: 'null' }, { keyword: 'describe', args: '"Your address"' }],
      },
    }),
    expected: 'z.object({"firstName": z.string().min(2),"address": z.string().describe("Your address").nullable()})',
  },
  {
    input: parseZodMeta({
      keyword: 'object',
      args: undefined,
    }),
    expected: 'z.object({})',
  },

  {
    input: parseZodMeta({
      keyword: 'default',
      args: "'default'",
    }),
    expected: ".default('default')",
  },
  {
    input: parseZodMeta({
      keyword: 'default',
    }),
    expected: '.default()',
  },
]

describe('parseZod', () => {
  // test.each(input)('.add($a, $b)', ({ input, expected }) => {
  //   expect(input).toBe(expected)
  // })

  test('parsing each input', () => {
    // TODO replace by test.each when Bun has support for test.each
    input.forEach((item) => {
      expect(item.input).toBe(item.expected)
    })
  })

  test('empty items should return an export with an empty string as result', () => {
    expect(zodParser([], { name: 'name' })).toBe("export const name = '';")
  })
})

describe('zodGenerator validates mocks/zod_parser correctly', async () => {
  const path = pathParser.resolve(__dirname, '../../mocks/zod_parser.yaml')
  const oas = await oasPathParser(path)
  const schemas = oas.getDefinition().components?.schemas as Record<string, OpenAPIV3.SchemaObject>

  test('UuidSchema generates a string with uuid format constraint', async () => {
    const generator = new ZodGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
    })
    const schema = schemas['UuidSchema'] as OpenAPIV3.SchemaObject as OpenAPIV3.SchemaObject
    const node = generator.build({ schema, baseName: 'UuidSchema' })

    expect(node).toEqual([`export const UuidSchema = z.string().uuid();`])
  })

  test('NullableString zodifies correctly', async () => {
    const generator = new ZodGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
    })
    const schema = schemas['NullableString'] as OpenAPIV3.SchemaObject
    const node = generator.build({ schema, baseName: 'NullableString' })

    expect(node).toEqual([`export const NullableString = z.string().nullable();`])
  })

  test('NullableStringWithAnyOf results in union of string and null', async () => {
    const generator = new ZodGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
    })
    const schema = schemas['NullableStringWithAnyOf'] as OpenAPIV3.SchemaObject
    const node = generator.build({ schema, baseName: 'NullableStringWithAnyOf' })

    expect(node).toEqual([`export const NullableStringWithAnyOf = z.union([z.string(),z.null()]);`])
  })

  test('NullableStringUuid zodifies correctly to a uuid or null', async () => {
    const generator = new ZodGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
    })
    const schema = schemas['NullableStringUuid'] as OpenAPIV3.SchemaObject
    const node = generator.build({ schema, baseName: 'NullableStringUuid' })

    expect(node).toEqual([`export const NullableStringUuid = z.string().uuid().nullable();`])
  })

  test('NullConst zodifies correctly', async () => {
    const generator = new ZodGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
    })
    const schema = schemas['NullConst'] as OpenAPIV3.SchemaObject
    const node = generator.build({ schema, baseName: 'NullConst' })

    expect(node).toEqual([`export const NullConst = z.literal(z.null());`])
  })

  test('StringValueConst correctly generates zod literal', async () => {
    const generator = new ZodGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
    })

    const schema = schemas['StringValueConst'] as OpenAPIV3.SchemaObject
    const node = generator.build({ schema, baseName: 'StringValueConst' })

    expect(node).toEqual([`export const StringValueConst = z.object({"foobar": z.literal("foobar")});`])
  })

  test('NumberValueConst correctly generates zod literal', async () => {
    const generator = new ZodGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
    })
    const schema = schemas['NumberValueConst'] as OpenAPIV3.SchemaObject
    const node = generator.build({ schema, baseName: 'NumberValueConst' })

    expect(node).toEqual([`export const NumberValueConst = z.object({"foobar": z.literal(42)});`])
  })

  test('MixedValueTypeConst generates zod literal value correctly, overriding the type constraint', async () => {
    const generator = new ZodGenerator({
      withJSDocs: false,
      resolveName: ({ name }) => name,
    })
    const schema = schemas['MixedValueTypeConst'] as OpenAPIV3.SchemaObject
    const node = generator.build({ schema, baseName: 'MixedValueTypeConst' })

    expect(node).toEqual([`export const MixedValueTypeConst = z.object({"foobar": z.literal("foobar")});`])
  })
})
