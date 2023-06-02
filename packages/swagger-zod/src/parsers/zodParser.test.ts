import { parseZod } from './zodParser.ts'

const input = [
  {
    input: parseZod([
      {
        keyword: 'z.string',
      },
    ]),
    expected: 'z.string()',
  },
  {
    input: parseZod([
      {
        keyword: 'z.number',
      },
    ]),
    expected: 'z.number()',
  },
  {
    input: parseZod([
      {
        keyword: 'z.boolean',
      },
    ]),
    expected: 'z.boolean()',
  },
  {
    input: parseZod([
      {
        keyword: 'z.any',
      },
    ]),
    expected: 'z.any()',
  },
  {
    input: parseZod([
      {
        keyword: '.nullable',
      },
    ]),
    expected: '.nullable()',
  },
  {
    input: parseZod([
      {
        keyword: 'z.undefined',
      },
    ]),
    expected: 'z.undefined()',
  },
  {
    input: parseZod([
      {
        keyword: '.min',
        args: 2,
      },
    ]),
    expected: '.min(2)',
  },
  {
    input: parseZod([
      {
        keyword: '.max',
        args: 2,
      },
    ]),
    expected: '.max(2)',
  },
  {
    input: parseZod([
      {
        keyword: '.regex',
        args: '*',
      },
    ]),
    expected: '.regex(*)',
  },
  {
    input: parseZod([
      {
        keyword: 'ref',
        args: 'Pet',
      },
    ]),
    expected: 'z.lazy(() => Pet)',
  },
  {
    input: parseZod([
      {
        keyword: 'z.enum',
        args: ['"A"', '"B"', '"C"', 2],
      },
    ]),
    expected: 'z.enum("A","B","C",2)',
  },

  {
    input: parseZod([
      {
        keyword: 'z.tuple',
        args: [],
      },
    ]),
    expected: 'z.tuple([])',
  },
  {
    input: parseZod([
      {
        keyword: 'z.tuple',
        args: [{ keyword: 'z.string' }, { keyword: 'z.number' }],
      },
    ]),
    expected: 'z.tuple([z.string(),z.number()])',
  },

  {
    input: parseZod([
      {
        keyword: 'z.array',
        args: [],
      },
    ]),
    expected: 'z.array()',
  },
  {
    input: parseZod([
      {
        keyword: 'z.array',
        args: [{ keyword: 'ref', args: 'Pet' }],
      },
    ]),
    expected: 'z.array(z.lazy(() => Pet))',
  },

  {
    input: parseZod([
      {
        keyword: 'z.union',
        args: [],
      },
    ]),
    expected: '.and(z.union([]))',
  },
  {
    input: parseZod([
      {
        keyword: 'z.union',
        args: [{ keyword: 'z.string' }, { keyword: 'z.number' }],
      },
    ]),
    expected: '.and(z.union([z.string(),z.number()]))',
  },

  {
    input: parseZod([
      {
        keyword: '.catchall',
        args: [],
      },
    ]),
    expected: '.catchall()',
  },
  {
    input: parseZod([
      {
        keyword: '.catchall',
        args: [{ keyword: 'ref', args: 'Pet' }],
      },
    ]),
    expected: '.catchall(z.lazy(() => Pet))',
  },

  {
    input: parseZod([
      {
        keyword: '.and',
        args: [{ keyword: 'z.string' }, { keyword: 'z.number' }],
      },
    ]),
    expected: '.and(z.string()).and(z.number())',
  },

  {
    input: parseZod([
      {
        keyword: 'z.object',
        args: {
          firstName: [{ keyword: 'z.string' }, { keyword: '.min', args: 2 }],
          address: [{ keyword: 'z.string' }, { keyword: '.nullable' }, { keyword: '.describe', args: '"Your address"' }],
        },
      },
    ]),
    expected: 'z.object({"firstName": z.string().min(2),"address": z.string().describe("Your address").nullable()})',
  },
]

describe('parseZod', () => {
  test.each(input)('.add($a, $b)', ({ input, expected }) => {
    expect(input).toBe(expected)
  })
})
