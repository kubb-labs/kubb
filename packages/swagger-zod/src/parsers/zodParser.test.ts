import { parseZodMeta, zodParser } from './zodParser.ts'

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
    expected: 'z.lazy(() => Pet)',
  },
  {
    input: parseZodMeta({
      keyword: 'enum',
      args: ['"A"', '"B"', '"C"', 2],
    }),
    expected: 'z.enum("A","B","C",2)',
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
    expected: 'z.array(z.lazy(() => Pet))',
  },

  {
    input: parseZodMeta({
      keyword: 'union',
      args: [],
    }),
    expected: 'z.union([])',
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
    expected: '.catchall(z.lazy(() => Pet))',
  },

  {
    input: parseZodMeta({
      keyword: 'and',
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    }),
    expected: '.and(z.string()).and(z.number())',
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
    //TODO replace by test.each when Bun has support for test.each
    input.forEach((item) => {
      expect(item.input).toBe(item.expected)
    })
  })

  test('empty items should return an export with an empty string as result', () => {
    expect(zodParser([], { name: 'name' })).toBe("export const name = '';")
  })
})
