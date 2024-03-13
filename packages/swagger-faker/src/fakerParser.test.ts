import { toIndexKey } from '@kubb/core/transformers'

import { parseFakerMeta } from './fakerParser.ts'

// TODO also check on not set items/undefined
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
      keyword: 'integer',
    }),
    expected: 'faker.number.int()',
  },
  {
    input: parseFakerMeta({
      keyword: 'boolean',
    }),
    expected: 'faker.datatype.boolean()',
  },
  {
    input: parseFakerMeta({
      keyword: 'date',
    }),
    expected: undefined,
  },
  {
    input: parseFakerMeta({
      keyword: 'datetime',
    }),
    expected: 'faker.date.anytime()',
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
      keyword: 'matches',
      args: '^[A-Z]{2}$',
    }),
    expected: 'faker.helpers.fromRegExp(/^[A-Z]{2}$/)',
  },
  {
    input: parseFakerMeta({
      keyword: 'ref',
      args: { name: 'createPet' },
    }),
    expected: 'createPet()',
  },
  {
    input: parseFakerMeta({
      keyword: 'enum',
      args: [{ key: 'A', value: 'A' }, { key: 'B', value: 'B' }, { key: 'C', value: 'C' }, { key: 2, value: 2 }].map(({ value, key }) => ({
        key: toIndexKey(key),
        value: toIndexKey(value),
      })),
    }),
    expected: 'faker.helpers.arrayElement<any>(["A", "B", "C", 2])',
  },

  {
    input: parseFakerMeta({
      keyword: 'tuple',
      args: [],
    }),
    expected: 'faker.helpers.arrayElements([]) as any',
  },
  {
    input: parseFakerMeta({
      keyword: 'tuple',
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    }),
    expected: 'faker.helpers.arrayElements([faker.string.alpha(),faker.number.float()]) as any',
  },

  {
    input: parseFakerMeta({
      keyword: 'array',
      args: [],
    }),
    expected: 'faker.helpers.arrayElements([]) as any',
  },
  {
    input: parseFakerMeta({
      keyword: 'array',
      args: [{ keyword: 'ref', args: { name: 'createPet' } }],
    }),
    expected: 'faker.helpers.arrayElements([createPet()]) as any',
  },

  {
    input: parseFakerMeta({
      keyword: 'union',
      args: [],
    }),
    expected: 'faker.helpers.arrayElement([]) as any',
  },
  {
    input: parseFakerMeta({
      keyword: 'union',
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    }),
    expected: 'faker.helpers.arrayElement([faker.string.alpha(),faker.number.float()]) as any',
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
        entries: {
          firstName: [{ keyword: 'string', args: { min: 2 } }],
          address: [{ keyword: 'string' }, { keyword: 'null' }],
        },
      },
    }),
    expected: '{"firstName": faker.string.alpha({"min":2}),"address": faker.helpers.arrayElement([faker.string.alpha(),null])}',
  },
]

describe('parseFaker', () => {
  test.each(input)('.add($a, $b)', ({ input, expected }) => {
    expect(input).toBe(expected)
  })
})
