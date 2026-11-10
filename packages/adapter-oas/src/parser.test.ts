import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { adapterOas } from './adapter.ts'
import { createSchemaParser, type OasParserContext } from './parser.ts'
import { createRefs } from './refs.ts'
import type { AdapterOasOptions, Document, SchemaObject } from './types.ts'

const emptyDocument: Document = {
  openapi: '3.0.0',
  info: { title: '', version: '' },
  paths: {},
} as Document

// A document without a component registry parses `$ref`s leniently: the target is expected to
// live outside the fragment, so the node stays a `ref` instead of falling back to `unknown`.
const emptyCtx: OasParserContext = { document: emptyDocument, refs: createRefs(emptyDocument) }

const multiResponseDocument = {
  openapi: '3.0.3',
  info: { title: 'Test', version: '1.0.0' },
  paths: {
    '/pets/{petId}': {
      get: {
        operationId: 'getPetById',
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { name: { type: 'string' } } },
              },
              'application/xml': {
                schema: { type: 'object', properties: { name: { type: 'string' } } },
              },
            },
          },
        },
      },
    },
  },
} as Document

type SchemaCase = {
  title: string
  schema: SchemaObject
  options?: Partial<ast.ParserOptions>
  expected: Record<string, unknown>
}

/**
 * Parses a single OpenAPI `SchemaObject` into a `SchemaNode`, mirroring the
 * `createSchemaParser()` helper for single-schema test cases.
 */
function parseSchema(ctx: OasParserContext, { schema, name }: { schema: SchemaObject; name?: string }, options?: Partial<ast.ParserOptions>): ast.SchemaNode {
  return createSchemaParser({ ...ctx, options })({ schema, name })
}

/**
 * Parses a full OpenAPI document through the real adapter, so collision renames, discriminator
 * propagation and root enums apply exactly as they do in a build.
 */
async function parseOas(data: unknown, options: AdapterOasOptions = {}): Promise<ast.InputNode> {
  return adapterOas({ validate: false, ...options }).parse({ type: 'data', data })
}

function findSchema(root: ast.InputNode, name: string): ast.SchemaNode | undefined {
  return root.schemas.find((schema) => schema.name === name)
}

function findOperation(root: ast.InputNode, operationId: string): ast.OperationNode | undefined {
  return root.operations.find((operation) => operation.operationId === operationId)
}

describe('buildAst', () => {
  describe('$ref resolution', () => {
    const document = {
      openapi: '3.0.0',
      info: { title: '', version: '' },
      paths: {
        '/foo': {
          get: {
            responses: {
              '200': { description: 'OK', content: { 'application/json': { schema: { type: 'object' } } } },
              '404': { description: 'Missing', content: { 'application/json': { schema: { type: 'object', nullable: true } } } },
            },
          },
        },
      },
      components: { schemas: { Pet: { type: 'object', properties: { id: { type: 'integer' } } } } },
    } as Document

    it('keeps the nullability of an inlined path ref used as a property', () => {
      const $ref = '#/paths/~1foo/get/responses/404/content/application~1json/schema'
      const node = parseSchema({ document, refs: createRefs(document) }, { schema: { type: 'object', properties: { a: { $ref } } } })

      expect(ast.narrowSchema(node, 'object')?.properties?.[0]?.schema.nullable).toBe(true)
    })
  })

  describe('operations', () => {
    it('reads the schema and media type of a parameter described with content', async () => {
      const oas = {
        openapi: '3.0.3',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/orders': {
            get: {
              operationId: 'listOrders',
              parameters: [
                {
                  name: 'filter',
                  in: 'query',
                  content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' } } } } },
                },
                { name: 'sort', in: 'query', schema: { type: 'string' } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }
      const root = await parseOas(oas)
      const op = findOperation(root, 'listOrders')

      const filter = op?.parameters.find((p) => p.name === 'filter')
      expect(filter).toMatchObject({ contentType: 'application/json', schema: { type: 'object' } })
      expect(op?.parameters.find((p) => p.name === 'sort')).not.toHaveProperty('contentType')
    })

    it('carries the encoding of a form body onto its content entry', async () => {
      const root = await parseOas({
        openapi: '3.0.3',
        info: { title: 't', version: '1' },
        paths: {
          '/u': {
            post: {
              operationId: 'urlenc',
              requestBody: {
                content: {
                  'application/x-www-form-urlencoded': {
                    schema: {
                      type: 'object',
                      properties: { tags: { type: 'array', items: { type: 'string' } }, filter: { type: 'object' }, plain: { type: 'string' } },
                    },
                    encoding: {
                      filter: { style: 'deepObject', explode: true },
                      tags: { explode: false },
                      plain: {},
                    },
                  },
                  'multipart/form-data': {
                    schema: { type: 'object', properties: { meta: { type: 'object' } } },
                    encoding: { meta: { contentType: 'application/json', allowReserved: true } },
                  },
                },
              },
              responses: { '204': { description: 'ok' } },
            },
          },
        },
      })
      const content = findOperation(root, 'urlenc')?.requestBody?.content

      expect(content?.map((entry) => [entry.contentType, entry.encoding])).toStrictEqual([
        ['application/x-www-form-urlencoded', { filter: { style: 'deepObject', explode: true }, tags: { explode: false } }],
        ['multipart/form-data', { meta: { contentType: 'application/json', allowReserved: true } }],
      ])
    })

    it('keeps only the configured contentType in response.content', async () => {
      const root = await parseOas(multiResponseDocument, { contentType: 'application/xml' })
      const ok = findOperation(root, 'getPetById')?.responses.find((r) => r.statusCode === '200')

      expect(ok?.content?.map((entry) => entry.contentType)).toStrictEqual(['application/xml'])
    })
  })
})

describe('parseSchema types', () => {
  it.each([
    { schema: { type: 'string' }, type: 'string' },
    { schema: { type: 'integer' }, type: 'integer' },
    { schema: { type: 'number' }, type: 'number' },
    { schema: { type: 'null' }, type: 'null' },
    { schema: { type: ['null'] }, type: 'null' },
  ] satisfies Array<{ schema: SchemaObject; type: string }>)('maps type $schema.type to a $type node', ({ schema, type }) => {
    expect(parseSchema(emptyCtx, { schema }).type).toBe(type)
  })
})

describe('parseSchema format', () => {
  it.each([
    { title: 'string uuid', schema: { type: 'string', format: 'uuid' }, expected: { type: 'uuid', format: 'uuid' } },
    { title: 'uuid without type', schema: { format: 'uuid' }, expected: { type: 'uuid', format: 'uuid' } },
    { title: 'string email', schema: { type: 'string', format: 'email' }, expected: { type: 'email', format: 'email' } },
    { title: 'ipv4 without type', schema: { format: 'ipv4' }, expected: { type: 'ipv4', format: 'ipv4' } },
    { title: 'ipv6 without type', schema: { format: 'ipv6' }, expected: { type: 'ipv6', format: 'ipv6' } },
    { title: 'string uri', schema: { type: 'string', format: 'uri' }, expected: { type: 'url', format: 'uri' } },
    // A relative reference or a bare host name is not a URL, so these stay plain strings.
    { title: 'string uri-reference', schema: { type: 'string', format: 'uri-reference' }, expected: { type: 'string', format: 'uri-reference' } },
    { title: 'string hostname', schema: { type: 'string', format: 'hostname' }, expected: { type: 'string', format: 'hostname' } },
    { title: 'string idn-hostname', schema: { type: 'string', format: 'idn-hostname' }, expected: { type: 'string', format: 'idn-hostname' } },
    { title: 'integer duration', schema: { type: 'integer', format: 'duration' }, expected: { type: 'integer', format: 'duration' } },
    {
      title: 'string uri-reference with length and pattern',
      schema: { type: 'string', format: 'uri-reference', pattern: '^/', minLength: 2, maxLength: 10 },
      expected: { type: 'string', format: 'uri-reference', pattern: '^/', min: 2, max: 10 },
    },
    { title: 'string byte', schema: { type: 'string', format: 'byte' }, expected: { type: 'blob', format: 'byte' } },
    { title: 'integer int32', schema: { type: 'integer', format: 'int32' }, expected: { type: 'integer', format: 'int32' } },
    { title: 'integer int64 (default integerType bigint)', schema: { type: 'integer', format: 'int64' }, expected: { type: 'bigint', format: 'int64' } },
    { title: 'integer uint64 (default integerType bigint)', schema: { type: 'integer', format: 'uint64' }, expected: { type: 'bigint', format: 'uint64' } },
    { title: 'number float', schema: { type: 'number', format: 'float' }, expected: { type: 'number', format: 'float' } },
    { title: 'number double', schema: { type: 'number', format: 'double' }, expected: { type: 'number', format: 'double' } },
    { title: 'string with an unknown format', schema: { type: 'string', format: 'custom-format' }, expected: { type: 'string', format: 'custom-format' } },
    { title: 'enum with a format', schema: { type: 'string', format: 'custom-enum', enum: ['a', 'b'] }, expected: { type: 'enum', format: 'custom-enum' } },
    {
      title: 'int32 enum with x-enumNames',
      schema: { type: 'integer', format: 'int32', enum: [0, 1], 'x-enumNames': ['None', 'Received'] },
      expected: {
        type: 'union',
        format: 'int32',
        members: [
          { type: 'enum', enumValues: [0] },
          { type: 'enum', enumValues: [1] },
        ],
      },
    },
    {
      title: 'uuid enum',
      schema: { type: 'string', format: 'uuid', enum: ['a', 'b'] },
      expected: {
        type: 'union',
        format: 'uuid',
        members: [
          { type: 'enum', enumValues: ['a'] },
          { type: 'enum', enumValues: ['b'] },
        ],
      },
    },
    {
      title: 'date-time enum',
      schema: { type: 'string', format: 'date-time', enum: ['2024-01-01T00:00:00Z'] },
      expected: { type: 'union', format: 'date-time', members: [{ type: 'enum', enumValues: ['2024-01-01T00:00:00Z'] }] },
    },
    {
      title: 'date-time enum when dateType is date',
      schema: { type: 'string', format: 'date-time', enum: ['2024-01-01T00:00:00Z'] },
      options: { dateType: 'date' },
      expected: { type: 'date', format: 'date-time' },
    },
    {
      title: 'int64 enum (default integerType bigint)',
      schema: { type: 'integer', format: 'int64', enum: [0, 1] },
      expected: { type: 'bigint', format: 'int64' },
    },
    {
      title: 'int64 enum when integerType is number',
      schema: { type: 'integer', format: 'int64', enum: [0, 1] },
      options: { integerType: 'number' },
      expected: { type: 'union', format: 'int64' },
    },
    { title: 'binary enum', schema: { type: 'string', format: 'binary', enum: ['a'] }, expected: { type: 'blob', format: 'binary' } },
    {
      title: 'nullable int32 enum',
      schema: { type: 'integer', format: 'int32', nullable: true, enum: [null, 0] },
      expected: { type: 'union', format: 'int32', nullable: true, members: [{ type: 'enum', enumValues: [0] }] },
    },
    // A numeric format on a `type: 'string'` schema describes how the number is spelled, so the declared type wins.
    { title: 'string int64', schema: { type: 'string', format: 'int64' }, expected: { type: 'string', format: 'int64' } },
    { title: 'string float', schema: { type: 'string', format: 'float' }, expected: { type: 'string', format: 'float' } },
    {
      title: 'string int64 when integerType is number',
      schema: { type: 'string', format: 'int64' },
      options: { integerType: 'number' },
      expected: { type: 'string', format: 'int64' },
    },
  ] satisfies Array<SchemaCase>)('maps $title to $expected.type and keeps the format', ({ schema, options, expected }) => {
    expect(parseSchema(emptyCtx, { schema }, options)).toMatchObject(expected)
  })
})

describe('parseSchema default', () => {
  it.each([
    { title: 'a nullable string', schema: { type: 'string', nullable: true, default: null } },
    { title: 'an enum nullable through a null member', schema: { enum: ['a', null], default: null } },
  ] satisfies Array<{ title: string; schema: SchemaObject }>)('drops default: null on $title', ({ schema }) => {
    expect(parseSchema(emptyCtx, { schema }).default).toBeUndefined()
  })
})

describe('parseSchema type inference (no explicit type)', () => {
  it.each([
    { title: 'string from minLength and maxLength', schema: { minLength: 2, maxLength: 50 }, expected: { type: 'string', min: 2, max: 50 } },
    { title: 'string from pattern', schema: { pattern: '^[0-9]+$' }, expected: { type: 'string', pattern: '^[0-9]+$' } },
    {
      title: 'string from an unknown format with minLength',
      schema: { format: 'custom-format', minLength: 1 },
      expected: { type: 'string', format: 'custom-format' },
    },
    { title: 'number from minimum and maximum', schema: { minimum: 1, maximum: 100 }, expected: { type: 'number', min: 1, max: 100 } },
    { title: 'array from items', schema: { items: { type: 'string' } }, expected: { type: 'array' } },
    { title: 'object from additionalProperties: true', schema: { additionalProperties: true }, expected: { type: 'object', additionalProperties: true } },
    { title: 'object from patternProperties', schema: { patternProperties: { '^x-': { type: 'string' } } }, expected: { type: 'object' } },
  ] satisfies Array<SchemaCase>)('infers $title', ({ schema, expected }) => {
    expect(parseSchema(emptyCtx, { schema })).toMatchObject(expected)
  })
})

describe('parseSchema allOf', () => {
  it.each([
    {
      title: 'string member and outer annotations',
      schema: { allOf: [{ type: 'string' }], description: 'wrapped', deprecated: true, nullable: true },
      expected: { type: 'string', description: 'wrapped', deprecated: true, nullable: true },
    },
    {
      title: '$ref member and outer annotations',
      schema: { allOf: [{ $ref: '#/components/schemas/Foo' }], description: 'annotation only', nullable: true },
      expected: { type: 'ref', description: 'annotation only', nullable: true },
    },
  ] satisfies Array<SchemaCase>)('flattens a single-member allOf with a $title onto the member', ({ schema, expected }) => {
    // description / nullable / deprecated are safe to merge; no structural keys → flatten.
    expect(parseSchema(emptyCtx, { schema })).toMatchObject(expected)
  })

  it.each([
    // required on the outer schema signals structural intent — do not flatten.
    {
      title: 'required array',
      schema: { allOf: [{ type: 'object', properties: { id: { type: 'integer' }, name: { type: 'string' } } }], required: ['id'] },
    },
    // additionalProperties on the outer schema adds a constraint — do not flatten.
    { title: 'additionalProperties', schema: { allOf: [{ $ref: '#/components/schemas/Foo' }], additionalProperties: false } },
  ] satisfies Array<{ title: string; schema: SchemaObject }>)('produces an intersection when a single-member allOf has a sibling $title', ({ schema }) => {
    expect(parseSchema(emptyCtx, { schema }).type).toBe('intersection')
  })

  it('does not inject required keys that are already in outer properties', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        required: ['id'],
        properties: { id: { type: 'integer' } },
        allOf: [{ type: 'object', properties: { id: { type: 'integer' } } }],
      },
    })

    // only the allOf member + the sibling properties object; no extra injection
    const objectMembers = ast.narrowSchema(node, 'intersection')?.members?.filter((m) => m.type === 'object')
    expect(objectMembers).toHaveLength(2)
  })
})

describe('parseSchema oneOf / anyOf', () => {
  it.each([
    { keyword: 'oneOf', propertyName: 'petType' },
    { keyword: 'anyOf', propertyName: 'kind' },
  ] as const)('sets discriminatorPropertyName from a $keyword discriminator', ({ keyword, propertyName }) => {
    const node = parseSchema(emptyCtx, {
      schema: {
        [keyword]: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
        discriminator: { propertyName },
      },
    })

    expect(node).toMatchObject({ type: 'union', discriminatorPropertyName: propertyName })
  })

  describe('required-only union branches', () => {
    it('enriches containing schema required properties with sibling properties when allOf member nests union', () => {
      const node = parseSchema(emptyCtx, {
        schema: {
          type: 'object',
          allOf: [
            {
              properties: {
                id: { type: 'string' },
                channel: { type: 'string' },
                phone: { type: 'string' },
              },
            },
            {
              required: ['id'],
              oneOf: [{ required: ['channel'] }, { required: ['phone'] }],
            },
          ],
        },
      })

      expect(node.type).toBe('intersection')
      const intersection = ast.narrowSchema(node, 'intersection')!
      const secondMember = intersection.members?.[1]
      expect(secondMember).toBeDefined()
      const secondIntersection = ast.narrowSchema(secondMember!, 'intersection')
      expect(secondIntersection).toBeDefined()
      const sharedObj = secondIntersection?.members?.find((m) => m.type === 'object')
      const idProp = ast.narrowSchema(sharedObj!, 'object')?.properties.find((p) => p.name === 'id')
      expect(idProp).toMatchObject({ required: true, schema: { type: 'string' } })
    })

    it('falls back to unknown with required: true for required keys not declared in siblings', () => {
      const node = parseSchema(emptyCtx, {
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string' },
          },
          oneOf: [{ required: ['email'] }, { required: ['phone'] }],
        },
      })

      const intersection = ast.narrowSchema(node, 'intersection')!
      const unionNode = ast.narrowSchema(intersection.members?.[0], 'union')
      const branchPhone = ast.narrowSchema(unionNode?.members?.[1], 'object')

      expect(branchPhone?.properties).toMatchObject([{ name: 'phone', required: true, schema: { type: 'unknown' } }])
    })
  })
})

describe('parseSchema const (OAS 3.1)', () => {
  it('narrows a $ref with a sibling const to the literal', () => {
    const node = parseSchema(emptyCtx, { schema: { $ref: '#/components/schemas/KindEnum', const: 'circle' } })

    expect(node).toMatchObject({ type: 'enum', enumValues: ['circle'] })
  })

  it('boolean const inside an object property has no name (inline literal)', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'object',
        properties: {
          isHappy: { type: 'boolean', const: false },
        },
      },
      name: 'Pet',
    })

    const objectNode = ast.narrowSchema(node, 'object')
    const isHappyProp = objectNode?.properties.find((p) => p.name === 'isHappy')

    expect(isHappyProp?.schema).toMatchObject({ type: 'enum', name: null, enumValues: [false] })
  })
})

describe('parseSchema null', () => {
  it.each([
    { title: 'type: null', schema: { type: 'null' } },
    { title: 'const: null', schema: { const: null } },
  ] satisfies Array<{ title: string; schema: SchemaObject }>)('does not set nullable on a $title object property (avoids null | null)', ({ schema }) => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'object',
        properties: {
          field: schema,
        },
      },
      name: 'Wrapper',
    })

    const fieldProp = ast.narrowSchema(node, 'object')?.properties.find((p) => p.name === 'field')

    expect(fieldProp?.schema.type).toBe('null')
    expect(fieldProp?.schema.nullable).toBeUndefined()
  })
})

describe('parseSchema object patternProperties', () => {
  it.each([
    { title: 'an empty pattern schema', pattern: {} },
    // OAS 3.1 / JSON Schema 2020-12 allows boolean schemas for patternProperties values.
    // Cast simulates a `true` boolean schema at runtime where the TS type expects SchemaObject.
    { title: 'a true pattern schema', pattern: true as unknown as SchemaObject },
  ])('falls back to unknownType for $title', ({ pattern }) => {
    const node = parseSchema(emptyCtx, { schema: { type: 'object', patternProperties: { '^x-': pattern } } })

    expect(ast.narrowSchema(node, 'object')?.patternProperties?.['^x-']).toMatchObject({ type: 'unknown' })
  })
})

describe('parseSchema prefixItems (tuple)', () => {
  it('names an enum element inside a tuple property using parent + propName', () => {
    const node = parseSchema(
      emptyCtx,
      {
        schema: {
          type: 'object',
          properties: {
            identifier: { type: 'array', prefixItems: [{ type: 'integer' }, { type: 'string' }, { enum: ['NW', 'NE', 'SW', 'SE'] }] },
          },
        },
        name: 'Address',
      },
      { enumSuffix: 'enum' },
    )

    const identifierProp = ast.narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'identifier')
    const tupleNode = ast.narrowSchema(identifierProp?.schema, 'tuple')
    expect(tupleNode?.items?.[2]).toMatchObject({ type: 'enum', name: 'AddressIdentifierEnum' })
  })

  it('leaves non-enum tuple elements unnamed', () => {
    const node = parseSchema(
      emptyCtx,
      {
        schema: {
          type: 'object',
          properties: {
            coords: {
              type: 'array',
              prefixItems: [{ type: 'number' }, { type: 'number' }],
            },
          },
        },
        name: 'Location',
      },
      { enumSuffix: 'enum' },
    )

    const coordsProp = ast.narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'coords')
    const tupleNode = ast.narrowSchema(coordsProp?.schema, 'tuple')
    expect(tupleNode?.items?.map((item) => item.name)).toStrictEqual([undefined, undefined])
  })
})

describe('parseSchema enum', () => {
  it('parses the oneOf [enum, BlankEnum, NullEnum] pattern into a valid union', () => {
    const node = parseSchema(emptyCtx, {
      schema: { oneOf: [{ type: 'string', enum: ['active', 'inactive'] }, { enum: [''] }, { enum: [null] }] },
    })

    expect(ast.narrowSchema(node, 'union')?.members?.map((m) => m.type)).toStrictEqual(['enum', 'enum', 'null'])
  })

  it.each([
    { title: 'integer', schema: { type: 'integer', enum: [1, 2, 3] }, primitive: 'number', values: [1, 2, 3] },
    { title: 'number', schema: { type: 'number', enum: [0.5, 1.5] }, primitive: 'number', values: [0.5, 1.5] },
    { title: 'boolean', schema: { type: 'boolean', enum: [true, false] }, primitive: 'boolean', values: [true, false] },
    { title: 'integer with x-enumNames', schema: { type: 'integer', enum: [0, 1], 'x-enumNames': ['Off', 'On'] }, primitive: 'number', values: [0, 1] },
    { title: 'string with x-enumNames', schema: { enum: ['a', 'b'], 'x-enumNames': ['Alpha', 'Beta'] }, primitive: 'string', values: ['a', 'b'] },
  ] satisfies Array<{ title: string; schema: SchemaObject; primitive: string; values: Array<unknown> }>)(
    'produces namedEnumValues with primitive $primitive for a $title enum',
    async ({ schema, primitive, values }) => {
      const node = parseSchema(emptyCtx, { schema })
      const namedEnumValues = ast.narrowSchema(node, 'enum')?.namedEnumValues

      expect(node.type).toBe('enum')
      expect(node.primitive).toBe(primitive)
      expect(namedEnumValues?.map((v) => v.value)).toStrictEqual(values)
      expect(namedEnumValues?.every((v) => v.primitive === primitive)).toBe(true)
    },
  )

  it('x-enumNames deduplicates names', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        enum: [1, 2, 3],
        'x-enumNames': ['A', 'A', 'B'],
      },
    })

    expect(ast.narrowSchema(node, 'enum')?.namedEnumValues?.map((v) => v.name)).toStrictEqual(['A', 'B'])
  })

  it('x-enumNames keeps each name with its value when the enum holds null', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'integer',
        enum: [null, 0, 1],
        'x-enumNames': ['Null', 'Off', 'On'],
        'x-enumDescriptions': ['No value', 'Turned off', 'Turned on'],
      },
    })
    const values = ast.narrowSchema(node, 'enum')?.namedEnumValues

    expect(values?.map(({ name, value, description }) => ({ name, value, description }))).toStrictEqual([
      { name: 'Off', value: 0, description: 'Turned off' },
      { name: 'On', value: 1, description: 'Turned on' },
    ])
  })

  it.each([
    { title: 'minimum', schema: { type: 'integer', enum: [0, 1, 2], minimum: 1 }, values: [1, 2] },
    { title: 'maximum', schema: { type: 'integer', enum: [0, 1, 2], maximum: 1 }, values: [0, 1] },
    { title: 'exclusiveMinimum', schema: { type: 'integer', enum: [0, 1, 2], exclusiveMinimum: 0 }, values: [1, 2] },
    { title: 'exclusiveMaximum', schema: { type: 'integer', enum: [0, 1, 2], exclusiveMaximum: 2 }, values: [0, 1] },
    { title: 'multipleOf', schema: { type: 'number', enum: [0.3, 0.35, 0.6], multipleOf: 0.1 }, values: [0.3, 0.6] },
    { title: 'bounds that exclude every value', schema: { type: 'integer', enum: [0, 1], minimum: 5 }, values: [0, 1] },
  ] satisfies Array<{ title: string; schema: SchemaObject; values: Array<number> }>)('drops enum values outside $title', ({ schema, values }) => {
    const node = parseSchema(emptyCtx, { schema })

    expect(ast.narrowSchema(node, 'enum')?.namedEnumValues?.map((v) => v.value)).toStrictEqual(values)
  })

  it.each([
    { title: 'without items', schema: { type: 'array', enum: ['x', 'y'] } },
    { title: 'merging the existing items schema', schema: { type: 'array', items: { type: 'string' }, enum: ['x', 'y'] } },
  ] satisfies Array<{ title: string; schema: SchemaObject }>)('normalizes array+enum by moving enum into items $title', ({ schema }) => {
    const node = parseSchema(emptyCtx, { schema })

    expect(node.type).toBe('array')
    expect(ast.narrowSchema(node, 'array')?.items?.[0]).toMatchObject({ type: 'enum', enumValues: ['x', 'y'] })
  })
})

describe('parseSchema OAS 3.1 type array', () => {
  it('each union member schema carries the shared schema properties', () => {
    const node = parseSchema(emptyCtx, {
      schema: { type: ['string', 'integer'], readOnly: true },
    })

    expect(ast.narrowSchema(node, 'union')?.members?.map((member) => member.readOnly)).toStrictEqual([true, true])
  })
})

describe('parseSchema array', () => {
  it('produces an empty items array when items is absent', () => {
    const node = parseSchema(emptyCtx, { schema: { type: 'array' } })

    expect(ast.narrowSchema(node, 'array')?.items).toStrictEqual([])
  })

  // Regression for kubb-labs/kubb#3364: an operation response with the same shape as a
  // top-level component named `<Op><code>` must not produce colliding enum identifiers.
  // The operation path qualifies with `Status<code>` so its enums stay distinct from the
  // component's, avoiding the `TS2300: Duplicate identifier` re-export in the barrel.
  it('does not collide operation-response enums with a same-named component schema (#3364)', async () => {
    const oas = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      components: {
        schemas: {
          GetMaintenance200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['ok', 'failed'] },
                  },
                },
              },
            },
          },
        },
      },
      paths: {
        '/maintenance': {
          get: {
            operationId: 'getMaintenance',
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    // Inline (structurally equivalent to the component above) so the operation
                    // file emits its own copy of the nested enum under the response name.
                    schema: {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              status: { type: 'string', enum: ['ok', 'failed'] },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
    const root = await parseOas(oas)

    const collectEnumNames = (node: ast.SchemaNode | null | undefined): Array<string> =>
      node
        ? ast
            .collectSync(node, {
              schema(n) {
                return ast.narrowSchema(n, 'enum') ?? undefined
              },
            })
            .map((e) => e.name)
            .filter((name): name is string => !!name)
        : []

    const component = findSchema(root, 'GetMaintenance200')
    const responseSchema = findOperation(root, 'getMaintenance')?.responses.find((r) => r.statusCode === '200')?.content?.[0]?.schema

    const componentEnums = collectEnumNames(component)
    const responseEnums = collectEnumNames(responseSchema)

    // Schema path keeps the component-qualified name…
    expect(componentEnums).toContain('GetMaintenance200DataStatusEnum')
    // …while the operation response path qualifies with `Status<code>` so it cannot collide.
    expect(responseEnums).toContain('GetMaintenanceStatus200DataStatusEnum')

    // The core #3364 guarantee: no enum identifier is emitted by both file owners.
    expect(componentEnums.filter((name) => responseEnums.includes(name))).toStrictEqual([])
  })
})

describe('parser options', () => {
  describe('integerType', () => {
    it.each([{ title: 'integer uint64 to integer', schema: { type: 'integer', format: 'uint64' }, integerType: 'number', type: 'integer' }] satisfies Array<{
      title: string
      schema: SchemaObject
      integerType: ast.ParserOptions['integerType']
      type: string
    }>)('integerType: $integerType maps $title', async ({ schema, integerType, type }) => {
      const node = parseSchema(emptyCtx, { schema }, { integerType })

      expect(node.type).toBe(type)
    })
  })
})

describe('parseSchema circular allOf discriminator detection', () => {
  it('skips allOf member that references the child schema back through its discriminator parent', async () => {
    // This models the OAS pattern: Animal (parent, discriminator) → Cat (child, allOf: [Animal])
    // The parser must skip the back-reference to Animal from Cat's allOf to avoid circular types.
    const oas = {
      openapi: '3.0.3',
      info: { title: 'Circular', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Animal: {
            oneOf: [{ $ref: '#/components/schemas/Cat' }],
            discriminator: { propertyName: 'type' },
          },
          Cat: {
            allOf: [
              { $ref: '#/components/schemas/Animal' },
              {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string' },
                  name: { type: 'string' },
                },
              },
            ],
          },
        },
      },
    }

    const cat = findSchema(await parseOas(oas), 'Cat')

    expect(cat?.type).toBe('intersection')
    // The intersection should contain only the concrete Cat properties — Animal is filtered out.
    const members = ast.narrowSchema(cat, 'intersection')?.members ?? []
    expect(members.length).toBeGreaterThan(0)
    expect(members.some((m) => m.type === 'ref' && m.name === 'Animal')).toBe(false)
  })
})

describe('enum naming', () => {
  it('array items enum includes the parent schema name', () => {
    const node = parseSchema(
      emptyCtx,
      {
        schema: {
          type: 'object',
          properties: {
            tags: {
              type: 'array',
              items: { type: 'string', enum: ['a', 'b', 'c'] },
            },
          },
        },
        name: 'Item',
      },
      { enumSuffix: 'enum' },
    )

    const tagsProp = ast.narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'tags')
    const enumNode = ast.narrowSchema(ast.narrowSchema(tagsProp?.schema, 'array')?.items?.[0], 'enum')

    expect(enumNode?.name).toBe('ItemTagsEnum')
  })
})

describe('$ref path-item and requestBody resolution', () => {
  it('falls back to the $ref path-item summary and description', async () => {
    const document = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/things': { $ref: '#/components/pathItems/SharedPath' },
      },
      components: {
        pathItems: {
          SharedPath: {
            summary: 'Shared summary',
            description: 'Shared description',
            get: { operationId: 'listThingsWithDoc', responses: { '200': { description: 'ok' } } },
          },
        },
      },
    } as unknown as Document

    const op = findOperation(await parseOas(document), 'listThingsWithDoc')

    expect(op).toMatchObject({ summary: 'Shared summary', description: 'Shared description' })
  })
})

describe('OpenAPI 3.2', () => {
  const info = { title: 'Test', version: '1.0.0' }
  const messageDelta = { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] }

  function streamingDocument(content: Record<string, unknown>, openapi = '3.2.0') {
    return {
      openapi,
      info,
      paths: { '/stream': { get: { operationId: 'stream', responses: { '200': { description: 'OK', content } } } } },
      components: { schemas: { MessageDelta: messageDelta } },
    }
  }

  function firstContent(root: ast.InputNode, operationId = 'stream'): ast.ContentNode | undefined {
    return findOperation(root, operationId)?.responses[0]?.content?.[0]
  }

  function property(node: ast.ObjectSchemaNode, name: string): ast.PropertyNode | undefined {
    return node.properties.find((entry) => entry.name === name)
  }

  it('applies the keywords next to a $ref itemSchema to the referenced event schema', async () => {
    const root = await parseOas({
      ...streamingDocument({
        'text/event-stream': {
          itemSchema: {
            $ref: '#/components/schemas/Event',
            required: ['event'],
            oneOf: [
              { properties: { event: { const: 'addString' } } },
              {
                properties: {
                  event: { const: 'addJson' },
                  data: { contentMediaType: 'application/json', contentSchema: { $ref: '#/components/schemas/MessageDelta' } },
                },
              },
            ],
          },
        },
      }),
      components: {
        schemas: {
          MessageDelta: messageDelta,
          Event: { type: 'object', properties: { event: { type: 'string' }, data: { type: 'string' }, id: { type: 'string' }, retry: { type: 'integer' } } },
        },
      },
    })
    const content = firstContent(root)
    const union = ast.narrowSchema(content!.schema!, 'union')
    const [addString, addJson] = union!.members!.map((member) => ast.narrowSchema(member, 'object')!)

    expect(content?.stream).toMatchObject({ shape: 'event' })
    expect(union?.discriminatorPropertyName).toBe('event')
    expect(property(addString!, 'event')).toMatchObject({ required: true, schema: { type: 'enum', enumValues: ['addString'] } })
    expect(property(addString!, 'data')?.schema).toMatchObject({ type: 'string' })
    expect(property(addJson!, 'data')?.schema).toMatchObject({ type: 'ref', name: 'MessageDelta' })
    expect(property(addJson!, 'retry')).toMatchObject({ required: false, schema: { type: 'integer' } })
  })

  it('keeps a $ref member of an event union as a reference and still parses the inline members', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info,
      paths: {
        '/stream': {
          get: {
            operationId: 'stream',
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'text/event-stream': {
                    itemSchema: {
                      oneOf: [
                        { $ref: '#/components/schemas/Ping' },
                        {
                          type: 'object',
                          properties: {
                            event: { const: 'message_delta' },
                            data: { contentMediaType: 'application/JSON', contentSchema: { $ref: '#/components/schemas/MessageDelta' } },
                          },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: { schemas: { MessageDelta: messageDelta, Ping: { type: 'object', properties: { event: { const: 'ping' } } } } },
    })
    const content = firstContent(root)
    const [ping, delta] = ast.narrowSchema(content!.schema!, 'union')!.members!

    expect(content?.stream).toMatchObject({ shape: 'event' })
    expect(ping).toMatchObject({ type: 'ref', name: 'Ping' })
    expect(ast.narrowSchema(delta!, 'object')?.properties.find((entry) => entry.name === 'data')?.schema).toMatchObject({ type: 'ref', name: 'MessageDelta' })
  })

  it('types the item from itemSchema when schema is a string next to it', async () => {
    const content = firstContent(
      await parseOas(streamingDocument({ 'text/event-stream': { schema: { type: 'string' }, itemSchema: { $ref: '#/components/schemas/MessageDelta' } } })),
    )

    expect(content).toMatchObject({ schema: { type: 'ref', name: 'MessageDelta' }, stream: { shape: 'data', schema: { type: 'ref' } } })
  })

  it('keeps a 3.0 text/event-stream schema as the item schema', async () => {
    const content = firstContent(
      await parseOas(
        streamingDocument(
          {
            'text/event-stream': {
              schema: {
                oneOf: [
                  { type: 'object', properties: { event: { type: 'string', enum: ['ping'] } } },
                  { type: 'object', properties: { event: { type: 'string', enum: ['stock_update'] }, data: { type: 'object' } } },
                ],
                discriminator: { propertyName: 'event' },
              },
            },
          },
          '3.0.3',
        ),
      ),
    )

    expect(content).toMatchObject({ stream: { shape: 'event' }, schema: { type: 'union', discriminatorPropertyName: 'event' } })
    expect(content?.stream?.schema).toBe(content?.schema)
  })

  it('resolves a $ref into components.mediaTypes for a request body and a response', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info,
      paths: {
        '/items': {
          post: {
            operationId: 'createItem',
            requestBody: { content: { 'application/json': { $ref: '#/components/mediaTypes/Item' } } },
            responses: { '200': { description: 'OK', content: { 'application/jsonl': { $ref: '#/components/mediaTypes/ItemStream' } } } },
          },
        },
      },
      components: {
        schemas: { Item: { type: 'object', properties: { id: { type: 'string' } } } },
        mediaTypes: {
          Item: { schema: { $ref: '#/components/schemas/Item' } },
          ItemStream: { itemSchema: { $ref: '#/components/schemas/Item' } },
        },
      },
    })
    const op = findOperation(root, 'createItem')

    expect(op?.requestBody?.content).toMatchObject([{ contentType: 'application/json', schema: { type: 'ref', name: 'Item' } }])
    expect(op?.responses[0]?.content).toMatchObject([{ contentType: 'application/jsonl', schema: { type: 'ref', name: 'Item' }, stream: {} }])
  })

  it('generates the methods of additionalOperations next to the fixed methods', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info,
      paths: {
        '/cache': {
          parameters: [{ name: 'key', in: 'query', schema: { type: 'string' } }],
          get: { operationId: 'readCache', responses: { '200': { description: 'OK' } } },
          additionalOperations: {
            PURGE: {
              operationId: 'purgeCache',
              parameters: [{ name: 'token', in: 'header', schema: { type: 'string' } }],
              responses: { '204': { description: 'Purged' } },
            },
            // The spec forbids a fixed method here, so the entry is skipped instead of shadowing `get`.
            GET: { operationId: 'readCacheAgain', responses: { '200': { description: 'OK' } } },
            doWork: { operationId: 'doWork', responses: { '200': { description: 'OK' } } },
          },
        },
      },
    })
    const purge = findOperation(root, 'purgeCache')

    expect(root.operations.map((operation) => operation.method)).toStrictEqual(['GET', 'PURGE', 'doWork'])
    expect(findOperation(root, 'doWork')?.pointer).toBe('#/paths/~1cache/additionalOperations/doWork')
    expect(purge).toMatchObject({ path: '/cache', pointer: '#/paths/~1cache/additionalOperations/PURGE' })
    expect(purge?.parameters.map((parameter) => [parameter.name, parameter.pointer])).toStrictEqual([
      ['key', '#/paths/~1cache/parameters/0'],
      ['token', '#/paths/~1cache/additionalOperations/PURGE/parameters/0'],
    ])
    expect(purge?.responses[0]?.pointer).toBe('#/paths/~1cache/additionalOperations/PURGE/responses/204')
  })

  it('adds the defaultMapping schema as the fallback member of a discriminated union', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info,
      paths: {},
      components: {
        schemas: {
          Pet: {
            oneOf: [{ $ref: '#/components/schemas/Dog' }],
            discriminator: {
              propertyName: 'kind',
              mapping: { dog: '#/components/schemas/Dog', other: '#/components/schemas/UnknownPet' },
              defaultMapping: 'UnknownPet',
            },
          },
          Dog: { type: 'object', properties: { kind: { type: 'string' } } },
          UnknownPet: { allOf: [{ $ref: '#/components/schemas/Pet' }, { type: 'object', properties: { note: { type: 'string' } } }] },
        },
      },
    })
    const pet = ast.narrowSchema(findSchema(root, 'Pet')!, 'union')
    const unknownPet = findSchema(root, 'UnknownPet')!
    const literals = ast.collectSync<ast.SchemaNode>(unknownPet, { schema: (node) => (node.type === 'enum' ? node : undefined) })
    const parentRefs = ast.collectSync<ast.SchemaNode>(unknownPet, { schema: (node) => (node.type === 'ref' && node.name === 'Pet' ? node : undefined) })

    expect(pet?.members).toHaveLength(2)
    expect(pet?.members?.[0]).toMatchObject({ type: 'intersection', members: [{ type: 'ref', name: 'Dog' }, { type: 'object' }] })
    // The default member also appears in `mapping`, but it stays open to every value outside it, also where it inherits from the parent.
    expect(pet?.members?.[1]).toMatchObject({ type: 'ref', name: 'UnknownPet' })
    // The parent reference is dropped too, so `Pet` and `UnknownPet` do not refer to each other.
    expect(parentRefs).toHaveLength(0)
    expect(literals).toHaveLength(0)
  })
})

describe('OpenAPI 3.2 annotations', () => {
  const info = { title: 'Test', version: '1.0.0' }

  it('groups contentMediaType and the parsed contentSchema into content on a string schema', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info,
      paths: {},
      components: {
        schemas: {
          Payload: { type: 'string', contentMediaType: 'application/json', contentSchema: { $ref: '#/components/schemas/Pet' } },
          Pet: { type: 'object', properties: { name: { type: 'string' } } },
        },
      },
    })

    expect(findSchema(root, 'Payload')).toMatchObject({
      type: 'string',
      content: { mediaType: 'application/json', schema: { type: 'ref', name: 'Pet' } },
    })
  })
})

describe('OpenAPI 3.2 tags', () => {
  it('reads the tag summary, parent and kind into meta.tags', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      tags: [
        { name: 'animals', summary: 'Animals', kind: 'nav' },
        { name: 'cats', description: 'Cats only', parent: 'animals' },
      ],
    })

    expect(root.meta.tags).toStrictEqual([
      { name: 'animals', summary: 'Animals', kind: 'nav' },
      { name: 'cats', description: 'Cats only', parent: 'animals' },
    ])
  })
})

describe('OpenAPI 3.2 security schemes', () => {
  it('reads the deviceAuthorization flow, oauth2MetadataUrl and deprecated', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        securitySchemes: {
          oauth: {
            type: 'oauth2',
            oauth2MetadataUrl: 'https://auth.example.com/.well-known/oauth-authorization-server',
            deprecated: true,
            flows: {
              deviceAuthorization: {
                deviceAuthorizationUrl: 'https://auth.example.com/device',
                tokenUrl: 'https://auth.example.com/token',
                scopes: { read: 'Read access' },
              },
            },
          },
        },
      },
    })

    expect(root.meta.auth).toStrictEqual([
      {
        name: 'oauth',
        deprecated: true,
        credential: {
          type: 'oauth2',
          metadataUrl: 'https://auth.example.com/.well-known/oauth-authorization-server',
          flows: {
            deviceAuthorization: {
              deviceAuthorizationUrl: 'https://auth.example.com/device',
              tokenUrl: 'https://auth.example.com/token',
              scopes: { read: 'Read access' },
            },
          },
        },
      },
    ])
  })
})

describe('OpenAPI 3.2 encoding', () => {
  it('reads prefixEncoding, itemEncoding and nested encoding', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/batch': {
          post: {
            operationId: 'batch',
            requestBody: {
              content: {
                'multipart/mixed': {
                  schema: { type: 'array', prefixItems: [{ type: 'object' }, { type: 'object' }], items: { type: 'string' } },
                  prefixEncoding: [{ contentType: 'application/json' }, {}],
                  itemEncoding: { contentType: 'text/plain' },
                },
                'multipart/form-data': {
                  schema: { type: 'object', properties: { parts: { type: 'object' } } },
                  encoding: { parts: { contentType: 'multipart/mixed', encoding: { meta: { contentType: 'application/json' }, empty: {} } } },
                },
              },
            },
            responses: { '204': { description: 'Done' } },
          },
        },
      },
    })
    const [mixed, form] = findOperation(root, 'batch')!.requestBody!.content!

    expect(mixed).toMatchObject({ prefixEncoding: [{ contentType: 'application/json' }, {}], itemEncoding: { contentType: 'text/plain' } })
    expect(form?.encoding).toStrictEqual({ parts: { contentType: 'multipart/mixed', encoding: { meta: { contentType: 'application/json' } } } })
  })
})

describe('OpenAPI 3.2 examples', () => {
  it('reads dataValue and serializedValue of media type and parameter examples', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
            parameters: [
              {
                name: 'filter',
                in: 'query',
                schema: { type: 'object' },
                examples: { byName: { summary: 'By name', dataValue: { name: 'Rex' }, serializedValue: 'name=Rex' } },
              },
              { name: 'limit', in: 'query', schema: { type: 'integer' }, example: 10 },
            ],
            responses: {
              '200': {
                description: 'OK',
                content: { 'application/json': { schema: { type: 'object' }, examples: { rex: { $ref: '#/components/examples/Rex' } } } },
              },
            },
          },
        },
      },
      components: { examples: { Rex: { description: 'A dog', value: { name: 'Rex' } } } },
    })
    const operation = findOperation(root, 'listPets')!

    expect(operation.parameters.map((parameter) => parameter.examples)).toStrictEqual([
      [{ name: 'byName', summary: 'By name', value: { name: 'Rex' }, serializedValue: 'name=Rex' }],
      [{ value: 10 }],
    ])
    expect(operation.responses[0]?.content?.[0]?.examples).toStrictEqual([{ name: 'rex', description: 'A dog', value: { name: 'Rex' } }])
  })
})

describe('security requirements', () => {
  it('reads operation security, falls back to the document, and maps 3.2 URI keys to scheme names', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info: { title: 'Test', version: '1.0.0' },
      security: [{ apiKey: [] }],
      paths: {
        '/pets': {
          get: { operationId: 'listPets', responses: { '200': { description: 'OK' } } },
          post: {
            operationId: 'createPet',
            security: [{ '#/components/securitySchemes/oauth': ['write'] }, {}],
            responses: { '201': { description: 'Created' } },
          },
          delete: { operationId: 'clearPets', security: [], responses: { '204': { description: 'Done' } } },
        },
      },
      components: { securitySchemes: { apiKey: { type: 'apiKey', in: 'header', name: 'X-Key' }, oauth: { type: 'oauth2', flows: {} } } },
    })

    expect(root.operations.map(({ operationId, auth }) => [operationId, auth])).toStrictEqual([
      ['listPets', [[{ scheme: 'apiKey' }]]],
      ['createPet', [[{ scheme: 'oauth', scopes: ['write'] }], []]],
      ['clearPets', []],
    ])
  })
})

describe('OpenAPI 3.0 and 3.1 document fields', () => {
  it('reads info, externalDocs, response headers and links, parameter flags and openIdConnectUrl', async () => {
    const root = await parseOas({
      openapi: '3.0.3',
      info: {
        title: 'Test',
        version: '1.0.0',
        termsOfService: 'https://example.com/terms',
        contact: { name: 'API team', email: 'api@example.com' },
        license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
      },
      externalDocs: { url: 'https://example.com/docs' },
      tags: [{ name: 'pets', externalDocs: { url: 'https://example.com/pets' } }],
      paths: {
        '/pets': {
          post: {
            operationId: 'createPet',
            externalDocs: { url: 'https://example.com/create', description: 'Guide' },
            parameters: [{ name: 'legacy', in: 'query', deprecated: true, allowEmptyValue: true, schema: { type: 'string' } }],
            responses: {
              '201': {
                description: 'Created',
                headers: {
                  Location: { required: true, schema: { type: 'string' } },
                  'Content-Type': { schema: { type: 'string' } },
                  'X-Rate-Limit': { $ref: '#/components/headers/RateLimit' },
                },
                links: { getPet: { operationId: 'getPet', parameters: { petId: '$response.body#/id' } } },
              },
            },
          },
        },
      },
      components: {
        headers: { RateLimit: { description: 'Calls left', schema: { type: 'integer' } } },
        securitySchemes: { oidc: { type: 'openIdConnect', openIdConnectUrl: 'https://example.com/.well-known/openid-configuration' } },
      },
    })
    const operation = findOperation(root, 'createPet')!
    const response = operation.responses[0]!

    expect(root.meta).toMatchObject({
      termsOfService: 'https://example.com/terms',
      contact: { name: 'API team', email: 'api@example.com' },
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
      externalDocs: { url: 'https://example.com/docs' },
      tags: [{ name: 'pets', externalDocs: { url: 'https://example.com/pets' } }],
      auth: [{ name: 'oidc', credential: { type: 'openIdConnect', url: 'https://example.com/.well-known/openid-configuration' } }],
    })
    expect(operation.externalDocs).toStrictEqual({ url: 'https://example.com/create', description: 'Guide' })
    expect(operation.parameters[0]).toMatchObject({ deprecated: true, allowEmptyValue: true })
    expect(response.headers?.map(({ name, in: location, required, schema }) => [name, location, required, schema.type, schema.description])).toStrictEqual([
      ['Location', 'header', true, 'string', undefined],
      ['X-Rate-Limit', 'header', false, 'integer', 'Calls left'],
    ])
    expect(response.links).toStrictEqual({ getPet: { operationId: 'getPet', parameters: { petId: '$response.body#/id' } } })
  })
})

describe('JSON Schema 2020-12 object keywords', () => {
  it('closes an object with unevaluatedProperties: false and turns dependentRequired into a conditional', async () => {
    const root = await parseOas({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Payment: {
            type: 'object',
            properties: { creditCard: { type: 'string' }, billingAddress: { type: 'string' } },
            unevaluatedProperties: false,
            dependentRequired: { creditCard: ['billingAddress'] },
          },
          Labels: { type: 'object', unevaluatedProperties: { type: 'string' }, minProperties: 1, maxProperties: 5 },
        },
      },
    })

    const presence = (name: string) => ({ type: 'object', properties: [{ name, required: true, schema: { type: 'unknown' } }] })
    expect(findSchema(root, 'Payment')).toMatchObject({
      additionalProperties: false,
      conditionals: [{ if: presence('creditCard'), then: presence('billingAddress') }],
    })
    expect(findSchema(root, 'Labels')).toMatchObject({ additionalProperties: { type: 'string' }, min: 1, max: 5, minProperties: 1, maxProperties: 5 })
  })
  it('keeps an object open when unevaluatedProperties sits next to allOf, and skips an empty dependentRequired list', async () => {
    const root = await parseOas({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Base: { type: 'object', properties: { a: { type: 'string' } } },
          Extended: {
            type: 'object',
            properties: { x: { type: 'string' } },
            allOf: [{ $ref: '#/components/schemas/Base' }],
            unevaluatedProperties: false,
            dependentRequired: { x: [] },
          },
        },
      },
    })
    const extended = ast.narrowSchema(findSchema(root, 'Extended')!, 'intersection')!

    // `a` comes from `Base`, so closing the `x` object on its own would reject it.
    expect(extended.members?.find((member) => member.type === 'object')).not.toMatchObject({ additionalProperties: false })
    expect(extended.conditionals).toBeUndefined()
  })
})

describe('JSON Schema 2020-12 applicators', () => {
  it('reads if/then/else, dependentSchemas, contains and unevaluatedItems', async () => {
    const root = await parseOas({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Address: {
            type: 'object',
            properties: { country: { type: 'string' }, postalCode: { type: 'string' } },
            if: { properties: { country: { const: 'US' } } },
            then: { properties: { postalCode: { pattern: '^[0-9]{5}$' } } },
            else: { properties: { postalCode: { pattern: '^[A-Z0-9 ]+$' } } },
            dependentSchemas: { country: { required: ['postalCode'] } },
          },
          Tags: { type: 'array', items: { type: 'string' }, contains: { const: 'admin' }, minContains: 1, maxContains: 2 },
          Pair: { type: 'array', prefixItems: [{ type: 'string' }, { type: 'number' }], unevaluatedItems: false },
        },
      },
    })
    const address = findSchema(root, 'Address')!

    // `if`/`then`/`else` first, then the `dependentSchemas` entry: if `country` is present, require `postalCode`.
    expect(address.conditionals).toMatchObject([
      { if: { type: 'object' }, then: { type: 'object' }, else: { type: 'object' } },
      {
        if: { type: 'object', properties: [{ name: 'country', required: true }] },
        then: { type: 'object', properties: [{ name: 'postalCode', required: true }] },
      },
    ])
    expect(findSchema(root, 'Tags')).toMatchObject({ type: 'array', contains: { schema: { type: 'enum', enumValues: ['admin'] }, min: 1, max: 2 } })
    expect(findSchema(root, 'Pair')).toMatchObject({ type: 'tuple', rest: undefined })
  })
  it('reads if/then from allOf members', async () => {
    const root = await parseOas({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Base: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } },
          Rules: {
            allOf: [
              { $ref: '#/components/schemas/Base' },
              { if: { required: ['a'] }, then: { required: ['b'] } },
              { if: { required: ['c'] }, then: { required: ['d'] } },
            ],
          },
        },
      },
    })

    expect(findSchema(root, 'Rules')?.conditionals).toMatchObject([
      { if: { properties: [{ name: 'a' }] }, then: { properties: [{ name: 'b' }] } },
      { if: { properties: [{ name: 'c' }] }, then: { properties: [{ name: 'd' }] } },
    ])
  })
})

describe('JSON Schema identifiers', () => {
  it('resolves $refs to an $anchor or $id and a $dynamicRef to its $dynamicAnchor', async () => {
    const root = await parseOas({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Pet: { $anchor: 'pet', type: 'object', properties: { name: { type: 'string' } } },
          Owner: { $id: 'https://example.com/schemas/owner', type: 'object', properties: { id: { type: 'string' } } },
          Node: { $dynamicAnchor: 'node', type: 'object', properties: { children: { type: 'array', items: { $dynamicRef: '#node' } } } },
          Home: {
            type: 'object',
            properties: { pet: { $ref: '#pet' }, owner: { $ref: 'https://example.com/schemas/owner' } },
          },
        },
      },
    })
    const home = ast.narrowSchema(findSchema(root, 'Home')!, 'object')!
    const node = ast.narrowSchema(findSchema(root, 'Node')!, 'object')!

    expect(home.properties.map((property) => property.schema)).toMatchObject([
      { type: 'ref', name: 'Pet' },
      { type: 'ref', name: 'Owner' },
    ])
    expect(ast.narrowSchema(node.properties[0]!.schema, 'array')?.items?.[0]).toMatchObject({ type: 'ref', name: 'Node' })
  })
  it('resolves a $dynamicRef to the enclosing $dynamicAnchor and leaves example data as written', async () => {
    const root = await parseOas({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          List: {
            $dynamicAnchor: 'item',
            type: 'object',
            properties: { items: { type: 'array', items: { $dynamicRef: '#item' } } },
          },
          Name: { $dynamicAnchor: 'item', type: 'string' },
          Doc: { $anchor: 'doc', type: 'object', example: { $ref: '#doc' } },
        },
      },
    })
    const list = ast.narrowSchema(findSchema(root, 'List')!, 'object')!

    expect(ast.narrowSchema(list.properties[0]!.schema, 'array')?.items?.[0]).toMatchObject({ type: 'ref', name: 'List' })
    expect(findSchema(root, 'Doc')?.examples).toEqual([{ $ref: '#doc' }])
  })
})

describe('auth schemes', () => {
  it('maps each scheme to how a client sends the credential, and leaves out one it cannot place', async () => {
    const root = await parseOas({
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: {
        securitySchemes: {
          basic: { type: 'http', scheme: 'Basic', description: 'User and password' },
          digest: { type: 'http', scheme: 'digest' },
          key: { type: 'apiKey', in: 'cookie', name: 'sid' },
          bodyKey: { type: 'apiKey', in: 'body', name: 'key' },
          tls: { type: 'mutualTLS' },
        },
      },
    })

    expect(root.meta.auth).toStrictEqual([
      { name: 'basic', description: 'User and password', credential: { type: 'http', scheme: 'basic' } },
      { name: 'digest', credential: { type: 'http', scheme: 'digest' } },
      { name: 'key', credential: { type: 'apiKey', in: 'cookie', name: 'sid' } },
      { name: 'tls', credential: { type: 'mutualTLS' } },
    ])
  })
})
