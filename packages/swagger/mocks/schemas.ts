import { schemaKeywords, type Schema } from '../src/SchemaMapper'

export const schemas: Array<{ name: string; schema: Schema }> = [
  {
    name: 'any',
    schema: {
      keyword: schemaKeywords.any,
    },
  },
  {
    name: 'unknown',
    schema: {
      keyword: schemaKeywords.unknown,
    },
  },
  {
    name: 'string',
    schema: {
      keyword: schemaKeywords.string,
    },
  },
  {
    name: 'number',
    schema: {
      keyword: schemaKeywords.number,
    },
  },
  {
    name: 'boolean',
    schema: {
      keyword: schemaKeywords.boolean,
    },
  },
  {
    name: 'date',
    schema: {
      keyword: schemaKeywords.date,
    },
  },
  {
    name: 'datetime',
    schema: {
      keyword: schemaKeywords.datetime,
    },
  },
  {
    name: 'nullable',
    schema: {
      keyword: schemaKeywords.nullable,
    },
  },
  {
    name: 'undefined',
    schema: {
      keyword: schemaKeywords.undefined,
    },
  },
  {
    name: 'min',
    schema: {
      keyword: schemaKeywords.min,
      args: 2,
    },
  },
  {
    name: 'max',
    schema: {
      keyword: schemaKeywords.max,
      args: 2,
    },
  },
  {
    name: 'matchesReg',
    schema: {
      keyword: schemaKeywords.matches,
      args: '/node_modules/', // pure regexp
    },
  },
  {
    name: 'matches',
    schema: {
      keyword: schemaKeywords.matches,
      args: '^[A-Z]{2}$',
    },
  },
  {
    name: 'ref',
    schema: {
      keyword: schemaKeywords.ref,
      args: {
        name: 'Pet',
      },
    },
  },
  {
    name: 'ref',
    schema: {
      keyword: schemaKeywords.enum,
      args: [
        { name: 'A', value: 'A', format: 'string' },
        { name: 'B', value: 'B', format: 'string' },
        { name: 'C', value: 'C', format: 'string' },
        { name: 2, value: 2, format: 'number' },
      ],
    },
  },
  {
    name: 'tuple',
    schema: {
      keyword: schemaKeywords.tuple,
      args: [],
    },
  },
  {
    name: 'tupleMulti',
    schema: {
      keyword: schemaKeywords.tuple,
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    },
  },
  {
    name: 'array',
    schema: {
      keyword: schemaKeywords.array,
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    },
  },
  {
    name: 'arrayEmpty',
    schema: {
      keyword: schemaKeywords.array,
      args: [],
    },
  },
  {
    name: 'arrayRef',
    schema: {
      keyword: schemaKeywords.array,
      args: [{ keyword: 'ref', args: { name: 'Pet' } }],
    },
  },
  {
    name: 'union',
    schema: {
      keyword: schemaKeywords.union,
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    },
  },
  {
    name: 'unionOne',
    schema: {
      keyword: schemaKeywords.union,
      args: [{ keyword: 'string' }],
    },
  },
  {
    name: 'catchall',
    schema: {
      keyword: schemaKeywords.catchall,
      args: [{ keyword: 'ref', args: { name: 'Pet' } }],
    },
  },
  {
    name: 'and',
    schema: {
      keyword: schemaKeywords.and,
      args: [{ keyword: 'string' }, { keyword: 'number' }],
    },
  },
  {
    name: 'object',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        entries: {
          firstName: [{ keyword: 'string' }, { keyword: 'min', args: 2 }],
          address: [{ keyword: 'string' }, { keyword: 'nullable' }, { keyword: 'describe', args: '"Your address"' }],
        },
      },
    },
  },
  {
    name: 'objectAnd',
    schema: {
      keyword: 'object',
      args: {
        entries: {
          firstName: [{ keyword: 'string' }, { keyword: 'min', args: 2 }],
          address: [{ keyword: 'string' }, { keyword: 'nullable' }, { keyword: 'describe', args: '"Your address"' }],
        },
      },
    },
  },
  {
    name: 'objectEmpty',
    schema: {
      keyword: schemaKeywords.object,
    },
  },
  {
    name: 'default',
    schema: {
      keyword: schemaKeywords.default,
    },
  },
  {
    name: 'default',
    schema: {
      keyword: schemaKeywords.default,
      args: 'default',
    },
  },
  {
    name: 'blob',
    schema: {
      keyword: schemaKeywords.blob,
    },
  },
]
