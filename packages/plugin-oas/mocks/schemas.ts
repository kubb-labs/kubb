import { type Schema, schemaKeywords } from '../src/SchemaMapper'

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
    name: 'integer',
    schema: {
      keyword: schemaKeywords.integer,
    },
  },
  {
    name: 'boolean',
    schema: {
      keyword: schemaKeywords.boolean,
    },
  },
  {
    name: 'primitiveDate',
    schema: {
      keyword: schemaKeywords.date,
      args: {
        type: 'date',
      },
    },
  },
  {
    name: 'date',
    schema: {
      keyword: schemaKeywords.date,
      args: {
        type: 'string',
      },
    },
  },
  {
    name: 'time',
    schema: {
      keyword: schemaKeywords.time,
      args: {
        type: 'string',
      },
    },
  },
  {
    name: 'stringOffset',
    schema: {
      keyword: schemaKeywords.datetime,
      args: {
        offset: true,
      },
    },
  },
  {
    name: 'stringLocal',
    schema: {
      keyword: schemaKeywords.datetime,
      args: {
        local: true,
      },
    },
  },
  {
    name: 'datetime',
    schema: {
      keyword: schemaKeywords.datetime,
      args: {
        offset: false,
      },
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
        path: './pet.ts',
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
        asConst: false,
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
      args: {
        items: [],
      },
    },
  },
  {
    name: 'tupleMulti',
    schema: {
      keyword: schemaKeywords.tuple,
      args: {
        items: [{ keyword: schemaKeywords.string }, { keyword: schemaKeywords.number }],
      },
    },
  },
  {
    name: 'array',
    schema: {
      keyword: schemaKeywords.array,
      args: {
        items: [
          {
            keyword: schemaKeywords.union,
            args: [{ keyword: schemaKeywords.number }, { keyword: schemaKeywords.string }],
          },
        ],
      },
    },
  },
  {
    name: 'arrayEmpty',
    schema: {
      keyword: schemaKeywords.array,
      args: {
        items: [],
      },
    },
  },
  {
    name: 'arrayRef',
    schema: {
      keyword: schemaKeywords.array,
      args: {
        items: [
          {
            keyword: schemaKeywords.ref,
            args: { name: 'Pet', path: './pet.ts' },
          },
        ],
      },
    },
  },
  {
    name: 'arrayAdvanced',
    schema: {
      keyword: schemaKeywords.array,
      args: {
        items: [{ keyword: schemaKeywords.min, args: 1 }, { keyword: schemaKeywords.max, args: 10 }, { keyword: schemaKeywords.number }],
        min: 3,
        max: 10,
      },
    },
  },
  {
    name: 'arrayRegex',
    schema: {
      keyword: schemaKeywords.array,
      args: {
        items: [{ keyword: schemaKeywords.matches, args: '^[a-zA-Z0-9]{1,13}$' }, { keyword: schemaKeywords.string }],
        min: 3,
        max: 10,
      },
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
        additionalProperties: [
          {
            keyword: schemaKeywords.ref,
            args: { name: 'Pet', path: './Pet.ts' },
          },
        ],
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
    name: 'objectArray',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          ids: [
            {
              keyword: schemaKeywords.array,
              args: {
                items: [{ keyword: schemaKeywords.matches, args: '^[a-zA-Z0-9]{1,13}$' }, { keyword: schemaKeywords.string }],
                min: 3,
                max: 10,
              },
            },
          ],
        },
        additionalProperties: [],
      },
    },
  },
  {
    name: 'objectDates',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          dateTime: [{ keyword: schemaKeywords.datetime, args: { offset: true } }],
          date: [{ keyword: schemaKeywords.date, args: { type: 'string' } }],
          time: [{ keyword: schemaKeywords.time, args: { type: 'string' } }],
          nativeDate: [{ keyword: schemaKeywords.date, args: { type: 'date' } }],
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
              args: 3,
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
    name: 'objectEnum',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          version: [
            {
              keyword: schemaKeywords.schema,
              args: {
                format: 'string',
                type: 'string',
              },
            },
            {
              keyword: schemaKeywords.enum,
              args: {
                name: 'enum',
                typeName: 'Enum',
                asConst: false,
                items: [
                  { name: 'A', value: 'A', format: schemaKeywords.string },
                  { name: 'B', value: 'B', format: schemaKeywords.string },
                  { name: 'C', value: 'C', format: schemaKeywords.string },
                  { name: 2, value: 2, format: schemaKeywords.number },
                ],
              },
            },
            {
              keyword: schemaKeywords.min,
              args: 4,
            },
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
    name: 'PageSizeNumber',
    schema: [
      {
        keyword: schemaKeywords.number,
      },
      {
        keyword: schemaKeywords.default,
        args: 10,
      },
    ],
  },
  {
    name: 'PageSizeInteger',
    schema: [
      {
        keyword: schemaKeywords.integer,
      },
      {
        keyword: schemaKeywords.default,
        args: 10,
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
        keyword: schemaKeywords.schema,
        args: {
          type: 'object',
        },
      },
      {
        keyword: schemaKeywords.object,
        args: {
          properties: {
            status: [
              {
                keyword: schemaKeywords.enum,
                args: {
                  name: 'orderStatus',
                  asConst: false,
                  typeName: 'OrderStatus',
                  items: [
                    { name: 'Placed', value: 'placed', format: 'string' },
                    { name: 'Approved', value: 'approved', format: 'string' },
                  ],
                },
              },
            ],
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
        keyword: schemaKeywords.object,
        args: {
          properties: {},
          additionalProperties: [
            {
              keyword: schemaKeywords.integer,
            },
            {
              keyword: schemaKeywords.schema,
              args: {
                type: 'integer',
                format: 'int32',
              },
            },
            {
              keyword: schemaKeywords.optional,
            },
          ],
        },
      },
      {
        keyword: schemaKeywords.schema,
        args: {
          type: 'integer',
          format: 'int32',
        },
      },
      {
        keyword: schemaKeywords.optional,
      },
    ],
  },
]

export const schemas = {
  basic,
  full,
}
