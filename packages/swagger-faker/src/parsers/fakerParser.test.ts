import { parseFakerMeta } from './fakerParser.ts'

const input = [
  {
    input: parseFakerMeta({
      keyword: 'string',
    }),
    expected: 'faker.string.alpha()',
  },
  {
    input: parseFakerMeta({
      keyword: 'number',
    }),
    expected: 'faker.number.float()',
  },
  {
    input: parseFakerMeta({
      keyword: 'boolean',
    }),
    expected: 'faker.datatype.boolean()',
  },
  {
    input: parseFakerMeta({
      keyword: 'any',
    }),
    expected: 'undefined',
  },
  {
    input: parseFakerMeta({
      keyword: 'null',
    }),
    expected: 'null',
  },
  {
    input: parseFakerMeta({
      keyword: 'undefined',
    }),
    expected: 'undefined',
  },

  {
    input: parseFakerMeta({
      keyword: 'matches',
      args: '*',
    }),
    expected: 'faker.helpers.fromRegExp("*")',
  },
  {
    input: parseFakerMeta({
      keyword: 'ref',
      args: 'createPet',
    }),
    expected: 'createPet()',
  },
  {
    input: parseFakerMeta({
      keyword: 'enum',
      args: ['"A"', '"B"', '"C"', 2],
    }),
    expected: 'faker.helpers.arrayElement<any>("A","B","C",2)',
  },

  {
    input: parseFakerMeta({
      keyword: 'tuple',
      args: [],
    }),
    expected: 'faker.helpers.arrayElements([])',
  },
  {
    input: parseFakerMeta({
      keyword: 'tuple',
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    }),
    expected: 'faker.helpers.arrayElements([faker.string.alpha(),faker.number.float()])',
  },

  {
    input: parseFakerMeta({
      keyword: 'array',
      args: [],
    }),
    expected: 'faker.helpers.arrayElements([])',
  },
  {
    input: parseFakerMeta({
      keyword: 'array',
      args: [{ keyword: 'ref', args: 'createPet' }],
    }),
    expected: 'faker.helpers.arrayElements([createPet()])',
  },

  {
    input: parseFakerMeta({
      keyword: 'union',
      args: [],
    }),
    expected: 'faker.helpers.arrayElement<any>([])',
  },
  {
    input: parseFakerMeta({
      keyword: 'union',
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    }),
    expected: 'faker.helpers.arrayElement<any>([faker.string.alpha(),faker.number.float()])',
  },

  // {
  //   input: parseFakerMeta({
  //     keyword: 'catchall',
  //     args: [],
  //   }),
  //   expected: '.catchall()',
  // },
  // {
  //   input: parseFakerMeta({
  //     keyword: 'catchall',
  //     args: [{ keyword: 'ref' }],
  //   }),
  //   expected: '.catchall(z.lazy(() => Pet))',
  // },

  {
    input: parseFakerMeta({
      keyword: 'and',
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    }),
    expected: 'Object.assign({},faker.string.alpha(),faker.number.float())',
  },

  {
    input: parseFakerMeta({
      keyword: 'object',
      args: {
        firstName: [{ keyword: 'string', args: { min: 2 } }],
        address: [{ keyword: 'string' }, { keyword: 'null' }],
      },
    }),
    expected: '{"firstName": faker.string.alpha({"min":2}),"address": faker.string.alpha()null}',
  },
]

describe('parseZod', () => {
  test.each(input)('.add($a, $b)', ({ input, expected }) => {
    expect(input).toBe(expected)
  })
})
