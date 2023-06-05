import { fakerParser } from './fakerParser.ts'

const input = [
  {
    input: fakerParser([
      {
        keyword: 'z.string',
      },
    ]),
    expected: 'z.string()',
  },
  {
    input: fakerParser([
      {
        keyword: 'z.number',
      },
    ]),
    expected: 'z.number()',
  },
  {
    input: fakerParser([
      {
        keyword: 'z.boolean',
      },
    ]),
    expected: 'z.boolean()',
  },
  {
    input: fakerParser([
      {
        keyword: 'z.any',
      },
    ]),
    expected: 'z.any()',
  },
  {
    input: fakerParser([
      {
        keyword: '.nullable',
      },
    ]),
    expected: '.nullable()',
  },
  {
    input: fakerParser([
      {
        keyword: 'z.undefined',
      },
    ]),
    expected: 'z.undefined()',
  },
  {
    input: fakerParser([
      {
        keyword: '.min',
        args: 2,
      },
    ]),
    expected: '.min(2)',
  },
  {
    input: fakerParser([
      {
        keyword: '.max',
        args: 2,
      },
    ]),
    expected: '.max(2)',
  },
  {
    input: fakerParser([
      {
        keyword: '.regex',
        args: '*',
      },
    ]),
    expected: '.regex(*)',
  },
  {
    input: fakerParser([
      {
        keyword: 'ref',
        args: 'Pet',
      },
    ]),
    expected: 'z.lazy(() => Pet)',
  },
  {
    input: fakerParser([
      {
        keyword: 'z.enum',
        args: ['"A"', '"B"', '"C"', 2],
      },
    ]),
    expected: 'z.enum("A","B","C",2)',
  },

  {
    input: fakerParser([
      {
        keyword: 'z.tuple',
        args: [],
      },
    ]),
    expected: 'z.tuple([])',
  },
  {
    input: fakerParser([
      {
        keyword: 'z.tuple',
        args: [{ keyword: 'z.string' }, { keyword: 'z.number' }],
      },
    ]),
    expected: 'z.tuple([z.string(),z.number()])',
  },

  {
    input: fakerParser([
      {
        keyword: 'z.array',
        args: [],
      },
    ]),
    expected: 'z.array()',
  },
  {
    input: fakerParser([
      {
        keyword: 'z.array',
        args: [{ keyword: 'ref', args: 'Pet' }],
      },
    ]),
    expected: 'z.array(z.lazy(() => Pet))',
  },

  {
    input: fakerParser([
      {
        keyword: 'z.union',
        args: [],
      },
    ]),
    expected: '.and(z.union([]))',
  },
  {
    input: fakerParser([
      {
        keyword: 'z.union',
        args: [{ keyword: 'z.string' }, { keyword: 'z.number' }],
      },
    ]),
    expected: '.and(z.union([z.string(),z.number()]))',
  },

  {
    input: fakerParser([
      {
        keyword: '.catchall',
        args: [],
      },
    ]),
    expected: '.catchall()',
  },
  {
    input: fakerParser([
      {
        keyword: '.catchall',
        args: [{ keyword: 'ref', args: 'Pet' }],
      },
    ]),
    expected: '.catchall(z.lazy(() => Pet))',
  },

  {
    input: fakerParser([
      {
        keyword: '.and',
        args: [{ keyword: 'z.string' }, { keyword: 'z.number' }],
      },
    ]),
    expected: '.and(z.string()).and(z.number())',
  },

  {
    input: fakerParser([
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
