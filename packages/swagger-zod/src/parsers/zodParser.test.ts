import { zodParser } from './zodParser.ts'

const input = [
  {
    input: zodParser([
      {
        keyword: 'z.string',
      },
    ]),
    expected: 'z.string()',
  },
  {
    input: zodParser([
      {
        keyword: 'z.number',
      },
    ]),
    expected: 'z.number()',
  },
  {
    input: zodParser([
      {
        keyword: 'z.boolean',
      },
    ]),
    expected: 'z.boolean()',
  },
  {
    input: zodParser([
      {
        keyword: 'z.any',
      },
    ]),
    expected: 'z.any()',
  },
  {
    input: zodParser([
      {
        keyword: '.nullable',
      },
    ]),
    expected: '.nullable()',
  },
  {
    input: zodParser([
      {
        keyword: 'z.undefined',
      },
    ]),
    expected: 'z.undefined()',
  },
  {
    input: zodParser([
      {
        keyword: '.min',
        args: 2,
      },
    ]),
    expected: '.min(2)',
  },
  {
    input: zodParser([
      {
        keyword: '.max',
        args: 2,
      },
    ]),
    expected: '.max(2)',
  },
  {
    input: zodParser([
      {
        keyword: '.regex',
        args: '*',
      },
    ]),
    expected: '.regex(*)',
  },
  {
    input: zodParser([
      {
        keyword: 'ref',
        args: 'Pet',
      },
    ]),
    expected: 'z.lazy(() => Pet)',
  },
  {
    input: zodParser([
      {
        keyword: 'z.enum',
        args: ['"A"', '"B"', '"C"', 2],
      },
    ]),
    expected: 'z.enum("A","B","C",2)',
  },

  {
    input: zodParser([
      {
        keyword: 'z.tuple',
        args: [],
      },
    ]),
    expected: 'z.tuple([])',
  },
  {
    input: zodParser([
      {
        keyword: 'z.tuple',
        args: [{ keyword: 'z.string' }, { keyword: 'z.number' }],
      },
    ]),
    expected: 'z.tuple([z.string(),z.number()])',
  },

  {
    input: zodParser([
      {
        keyword: 'z.array',
        args: [],
      },
    ]),
    expected: 'z.array()',
  },
  {
    input: zodParser([
      {
        keyword: 'z.array',
        args: [{ keyword: 'ref', args: 'Pet' }],
      },
    ]),
    expected: 'z.array(z.lazy(() => Pet))',
  },

  {
    input: zodParser([
      {
        keyword: 'z.union',
        args: [],
      },
    ]),
    expected: '.and(z.union([]))',
  },
  {
    input: zodParser([
      {
        keyword: 'z.union',
        args: [{ keyword: 'z.string' }, { keyword: 'z.number' }],
      },
    ]),
    expected: '.and(z.union([z.string(),z.number()]))',
  },

  {
    input: zodParser([
      {
        keyword: '.catchall',
        args: [],
      },
    ]),
    expected: '.catchall()',
  },
  {
    input: zodParser([
      {
        keyword: '.catchall',
        args: [{ keyword: 'ref', args: 'Pet' }],
      },
    ]),
    expected: '.catchall(z.lazy(() => Pet))',
  },

  {
    input: zodParser([
      {
        keyword: '.and',
        args: [{ keyword: 'z.string' }, { keyword: 'z.number' }],
      },
    ]),
    expected: '.and(z.string()).and(z.number())',
  },

  {
    input: zodParser([
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
