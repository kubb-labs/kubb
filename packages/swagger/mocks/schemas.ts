import { schemaKeywords, type Schema } from '../src/SchemaMapper'

const basic: Array<{ name: string; schema: Schema }> = [
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
    name: schemaKeywords.string,
    schema: {
      keyword: schemaKeywords.string,
    },
  },
  {
    name: schemaKeywords.number,
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
    name: schemaKeywords.min,
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
    name: 'enum',
    schema: {
      keyword: schemaKeywords.enum,
      args: {
        name: 'enum',
        typeName: 'Enum',
        items: [
          { name: 'A', value: 'A', format: schemaKeywords.string },
          { name: 'B', value: 'B', format: schemaKeywords.string },
          { name: 'C', value: 'C', format: schemaKeywords.string },
          { name: 2, value: 2, format: schemaKeywords.number },
        ],
      },
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
      args: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }],
    },
  },
  {
    name: 'array',
    schema: {
      keyword: schemaKeywords.array,
      args: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }],
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
      args: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }],
    },
  },
  {
    name: 'unionOne',
    schema: {
      keyword: schemaKeywords.union,
      args: [{ keyword: schemaKeywords.string }],
    },
  },
  {
    name: 'catchall',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {},
        additionalProperties: [{ keyword: 'ref', args: { name: 'Pet' } }],
      },
    },
  },
  {
    name: 'and',
    schema: {
      keyword: schemaKeywords.and,
      args: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }],
    },
  },
  {
    name: 'object',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          firstName: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.min, args: 2 }],
          address: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.nullable }, { keyword: schemaKeywords.describe, args: '"Your address"' }],
        },
        additionalProperties: [],
      },
    },
  },
  {
    name: 'objectOptional',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          firstName: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.optional }, { keyword: schemaKeywords.min, args: 2 }],
          address: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.nullable }, { keyword: schemaKeywords.describe, args: '"Your address"' }],
        },
        additionalProperties: [],
      },
    },
  },
  {
    name: 'objectAnd',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          firstName: [
            { keyword: schemaKeywords.deprecated },
            { keyword: schemaKeywords.default, args: 'test' },
            {
              keyword: schemaKeywords.min,
              args: 2,
            },
            {
              keyword: schemaKeywords.string,
            },
          ],
          age: [
            { keyword: schemaKeywords.example, args: '2' },
            { keyword: schemaKeywords.default, args: 2 },
            {
              keyword: schemaKeywords.min,
              args: 2,
            },
            {
              keyword: schemaKeywords.number,
            },
          ],
          address: [
            {
              keyword: schemaKeywords.and,
              args: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }],
            },
            { keyword: schemaKeywords.nullable },
            { keyword: schemaKeywords.describe, args: 'Your address' },
          ],
        },
        additionalProperties: [],
      },
    },
  },
  {
    name: 'objectEmpty',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {},
        additionalProperties: [],
      },
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

const full: Array<{ name: string; schema: Schema[] }> = [
  {
    name: 'Upload',
    schema: [
      {
        keyword: schemaKeywords.blob,
      },
    ],
  },
  {
    name: 'Object',
    schema: [
      { keyword: schemaKeywords.nullable },
      { keyword: schemaKeywords.describe, args: 'Your address' },
      {
        keyword: schemaKeywords.object,
        args: {
          properties: {
            firstName: [
              { keyword: schemaKeywords.deprecated },
              { keyword: schemaKeywords.default, args: 'test' },
              {
                keyword: schemaKeywords.min,
                args: 2,
              },
              {
                keyword: schemaKeywords.string,
              },
            ],
            age: [
              { keyword: schemaKeywords.example, args: '2' },
              { keyword: schemaKeywords.default, args: 2 },
              {
                keyword: schemaKeywords.min,
                args: 2,
              },
              {
                keyword: schemaKeywords.number,
              },
            ],
            address: [
              {
                keyword: schemaKeywords.and,
                args: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }],
              },
              { keyword: schemaKeywords.nullable },
              { keyword: schemaKeywords.describe, args: 'Your address' },
            ],
          },
          additionalProperties: [],
        },
      },
    ],
  },
  {
    name: 'Order',
    schema: [
      {
        keyword: schemaKeywords.type,
        args: 'object',
      },
      {
        keyword: schemaKeywords.object,
        args: {
          properties: {
            'status': [{
              keyword: schemaKeywords.enum,
              args: {
                name: 'orderStatus',
                typeName: 'OrderStatus',
                items: [{ name: 'Placed', value: 'placed', format: 'string' }, { name: 'Approved', value: 'approved', format: 'string' }],
              },
            }],
          },
          additionalProperties: [],
        },
      },
    ],
  },
  {
    name: 'Record',
    schema: [
      {
        'keyword': schemaKeywords.object,
        'args': {
          'properties': {},
          'additionalProperties': [
            {
              'keyword': schemaKeywords.integer,
            },
            {
              'keyword': schemaKeywords.type,
              'args': 'integer',
            },
            {
              'keyword': schemaKeywords.format,
              'args': 'int32',
            },
            {
              'keyword': schemaKeywords.optional,
            },
          ],
        },
      },
      {
        'keyword': 'type',
        'args': 'object',
      },
      {
        'keyword': 'optional',
      },
    ],
  },
]

export const schemas = {
  basic,
  full,
}
