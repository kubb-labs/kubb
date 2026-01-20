import { type Schema, schemaKeywords } from '../SchemaMapper'

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
    name: 'const',
    schema: {
      keyword: schemaKeywords.const,
      args: {
        name: '',
        value: '',
        format: schemaKeywords.string,
      },
    },
  },
  {
    name: 'ref',
    schema: {
      keyword: schemaKeywords.ref,
      args: {
        $ref: '$ref',
        name: 'Pet',
        path: './pet.ts',
        isImportable: true,
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
    name: 'enumLiteralBoolean',
    schema: {
      keyword: schemaKeywords.enum,
      args: {
        asConst: true,
        items: [
          {
            format: 'boolean',
            name: 'true',
            value: true,
          },
          {
            format: 'boolean',
            name: 'false',
            value: false,
          },
        ],
        name: 'PetEnumLiteral',
        typeName: 'PetEnumLiteral',
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

            args: { name: 'Pet', $ref: '#component/schema/Pet', path: './pet.ts', isImportable: true },
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
        items: [{ keyword: schemaKeywords.matches, args: '^[a-zA-Z0-9]{1,13}$' }],
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
            args: { name: 'Pet', $ref: '#component/schema/Pet', path: './Pet.ts', isImportable: true },
          },
        ],
      },
    },
  },
  {
    name: 'and',
    schema: {
      keyword: schemaKeywords.and,
      args: [
        {
          keyword: schemaKeywords.object,
          args: {
            properties: {
              street: [{ keyword: schemaKeywords.string }],
            },
            additionalProperties: [],
          },
        },
        {
          keyword: schemaKeywords.object,
          args: {
            properties: {
              city: [{ keyword: schemaKeywords.string }],
            },
            additionalProperties: [],
          },
        },
      ],
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
                items: [{ keyword: schemaKeywords.matches, args: '^[a-zA-Z0-9]{1,13}$' }],
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
              args: [
                {
                  keyword: schemaKeywords.object,
                  args: {
                    properties: {
                      street: [{ keyword: schemaKeywords.string }],
                    },
                    additionalProperties: [],
                  },
                },
                {
                  keyword: schemaKeywords.object,
                  args: {
                    properties: {
                      city: [{ keyword: schemaKeywords.string }],
                    },
                    additionalProperties: [],
                  },
                },
              ],
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
    name: 'objectObjectEnum',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          prop1: [
            {
              keyword: schemaKeywords.object,
              args: {
                properties: {
                  prop2: [
                    {
                      keyword: schemaKeywords.schema,
                      args: { format: 'string', type: 'string' },
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
        additionalProperties: [],
      },
    },
  },
  {
    name: 'objectArrayObject',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          ids: [
            {
              keyword: schemaKeywords.array,
              args: {
                items: [
                  {
                    keyword: schemaKeywords.object,
                    args: {
                      properties: {
                        enum: [
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
                        ],
                      },
                      additionalProperties: [],
                    },
                  },
                ],
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
  {
    name: 'nullableAdditionalProperties',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {},
        additionalProperties: [
          {
            keyword: schemaKeywords.string,
          },
          {
            args: {
              format: undefined,
              type: schemaKeywords.string,
            },
            keyword: schemaKeywords.schema,
          },
          {
            keyword: schemaKeywords.nullable,
          },
        ],
      },
    },
  },
  {
    name: 'andRefEnum',
    schema: {
      keyword: schemaKeywords.and,
      args: [
        {
          keyword: schemaKeywords.ref,
          args: {
            $ref: '#/components/schemas/IssueCategory',
            name: 'createIssueCategory',
            path: './createIssueCategory.ts',
            isImportable: true,
          },
        },
      ],
    },
  },
  {
    name: 'objectWithNullableEnumRef',
    schema: {
      keyword: schemaKeywords.object,
      args: {
        properties: {
          category: [
            {
              keyword: schemaKeywords.and,
              args: [
                {
                  keyword: schemaKeywords.ref,
                  args: {
                    $ref: '#/components/schemas/IssueCategory',
                    name: 'createIssueCategory',
                    path: './createIssueCategory.ts',
                    isImportable: true,
                  },
                },
              ],
            },
          ],
        },
        additionalProperties: [],
      },
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
                args: [
                  { keyword: schemaKeywords.string },
                  {
                    keyword: schemaKeywords.object,
                    args: {
                      properties: {
                        street: [{ keyword: schemaKeywords.string }],
                        city: [{ keyword: schemaKeywords.string }],
                      },
                      additionalProperties: [],
                    },
                  },
                ],
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
    name: 'nullableAdditionalProperties',
    schema: [
      {
        keyword: schemaKeywords.object,
        args: {
          properties: {},
          additionalProperties: [
            {
              keyword: schemaKeywords.string,
            },
            {
              args: {
                format: undefined,
                type: schemaKeywords.string,
              },
              keyword: schemaKeywords.schema,
            },
            {
              keyword: schemaKeywords.number,
            },
          ],
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
