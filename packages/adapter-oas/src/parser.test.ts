import { ast } from '@kubb/kit'
import { describe, expect, it } from 'vitest'
import { buildMinimalOas } from '../mocks/oas.ts'
import { adapterOas } from './adapter.ts'
import { createSchemaParser, type OasParserContext } from './parser.ts'
import { createRefs } from './refs.ts'
import type { AdapterOasOptions, ContentType, Document, SchemaObject } from './types.ts'

const emptyDocument: Document = {
  openapi: '3.0.0',
  info: { title: '', version: '' },
  paths: {},
} as Document

// A document without a component registry parses `$ref`s leniently: the target is expected to
// live outside the fragment, so the node stays a `ref` instead of falling back to `unknown`.
const emptyCtx: OasParserContext = { document: emptyDocument, refs: createRefs(emptyDocument) }

// OAS 3.0 document whose binary bodies lose their schema on the upgrade to 3.1.
const binaryResponseDocument = {
  openapi: '3.0.2',
  info: { title: 'Test', version: '1.0.0' },
  paths: {
    '/essay': {
      get: {
        operationId: 'downloadEssay',
        responses: {
          '200': {
            description: 'Binary body',
            content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
          },
        },
      },
    },
    '/pdf': {
      get: {
        operationId: 'downloadPdf',
        responses: {
          '200': {
            description: 'PDF body',
            content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
          },
        },
      },
    },
  },
} as Document

const multipartUploadDocument = {
  openapi: '3.0.3',
  info: { title: 'Test', version: '1.0.0' },
  paths: {
    '/upload': {
      post: {
        operationId: 'upload',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' } } },
            },
            'multipart/form-data': {
              schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
            },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
  },
} as Document

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
  describe('schemas', () => {
    it('converts array schema and populates node.schema with the resolved ref schema', async () => {
      const root = await parseOas(await buildMinimalOas())
      const list = ast.narrowSchema(findSchema(root, 'PetList'), 'array')

      expect(list?.type).toBe('array')
      expect(list?.items).toHaveLength(1)
      expect(list?.items?.[0]).toMatchObject({ type: 'ref', schema: { type: 'object' } })
    })

    it('flattens single-member allOf and propagates nullable', async () => {
      const root = await parseOas(await buildMinimalOas())

      // Flattened to 'string', not an intersection
      expect(findSchema(root, 'NullableString')).toMatchObject({ type: 'string', nullable: true, readOnly: true, examples: ['some-value'] })
    })

    it('flattens single-member allOf for nullable $ref', async () => {
      const root = await parseOas(await buildMinimalOas())
      const nullableRef = ast.narrowSchema(findSchema(root, 'NullableRef'), 'union')

      // The 3.1 upgrade rewrites `{ $ref, nullable: true }` into `anyOf: [$ref, null]`, so the
      // single-member allOf flattens to that union instead of a ref carrying `nullable`.
      expect(nullableRef?.type).toBe('union')
      expect(nullableRef?.members?.map((member) => member.type)).toStrictEqual(['ref', 'null'])
      expect(ast.narrowSchema(nullableRef?.members?.[0], 'ref')?.ref).toBe('#/components/schemas/Pet')
    })

    it('maps formats on properties nested inside an allOf member', async () => {
      const root = await parseOas(await buildMinimalOas())
      const fullPet = ast.narrowSchema(findSchema(root, 'FullPet'), 'intersection')
      // second member is an inline object with createdAt (datetime) and email
      const objectMember = ast.narrowSchema(
        fullPet?.members?.find((m) => m.type === 'object'),
        'object',
      )

      expect(objectMember?.properties?.find((p) => p.name === 'createdAt')?.schema.type).toBe('datetime')
      expect(objectMember?.properties?.find((p) => p.name === 'email')?.schema.type).toBe('email')
    })
  })

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

    it.each([
      { title: 'a ref node for a defined component', $ref: '#/components/schemas/Pet', type: 'ref' },
      { title: 'unknown for a component the document never defines', $ref: '#/components/schemas/Missing', type: 'unknown' },
      { title: 'the target inline for a path outside components', $ref: '#/paths/~1foo/get/responses/200/content/application~1json/schema', type: 'object' },
    ])('returns $title', ({ $ref, type }) => {
      const node = parseSchema({ document, refs: createRefs(document) }, { schema: { $ref } })

      expect(node.type).toBe(type)
    })

    it('keeps the nullability of an inlined path ref used as a property', () => {
      const $ref = '#/paths/~1foo/get/responses/404/content/application~1json/schema'
      const node = parseSchema({ document, refs: createRefs(document) }, { schema: { type: 'object', properties: { a: { $ref } } } })

      expect(ast.narrowSchema(node, 'object')?.properties?.[0]?.schema.nullable).toBe(true)
    })

    it('keeps the usage-site description and default on an inlined path ref', () => {
      const $ref = '#/paths/~1foo/get/responses/200/content/application~1json/schema'
      const node = parseSchema({ document, refs: createRefs(document) }, { schema: { $ref, description: 'used here', default: {} } })

      expect([node.type, node.description, ast.narrowSchema(node, 'object')?.default]).toStrictEqual(['object', 'used here', {}])
    })
  })

  describe('operations', () => {
    it('sets operationId, method, path, tags and deprecated', async () => {
      const root = await parseOas(await buildMinimalOas())

      expect(findOperation(root, 'listPets')).toMatchObject({
        method: 'GET',
        path: '/pets',
        protocol: 'http',
        tags: ['pets'],
        summary: 'List all pets',
      })
      expect(findOperation(root, 'createPet')?.deprecated).toBe(true)
    })

    it.each([
      { operationId: 'listPets', method: 'GET', path: '/pets', name: 'limit', in: 'query', required: false },
      { operationId: 'getPetById', method: 'GET', path: '/pets/{petId}', name: 'petId', in: 'path', required: true },
    ])('converts $in parameters', async ({ operationId, method, path, name, in: location, required }) => {
      const root = await parseOas(await buildMinimalOas())
      const operation = findOperation(root, operationId)
      const parameter = operation?.parameters.find((p) => p.name === name)

      expect(operation).toMatchObject({ method, path })
      expect(parameter).toMatchObject({ in: location, required, schema: { type: 'integer' } })
    })

    it('converts path parameters with $ref schema to a named ref type', async () => {
      const oas = {
        openapi: '3.0.3',
        info: { title: 'Test', version: '1.0.0' },
        components: {
          schemas: {
            PetId: {
              type: 'integer',
              description: 'Unique identifier of a pet',
            },
          },
        },
        paths: {
          '/pets/{petId}': {
            get: {
              operationId: 'getPetById',
              parameters: [
                {
                  name: 'petId',
                  in: 'path',
                  required: true,
                  schema: { $ref: '#/components/schemas/PetId' },
                },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      }
      const root = await parseOas(oas)
      const petId = findOperation(root, 'getPetById')?.parameters.find((p) => p.name === 'petId')

      expect(petId?.schema).toMatchObject({ type: 'ref', name: 'PetId' })
    })

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

    it('converts requestBody with description, required and a single content entry', async () => {
      const root = await parseOas(await buildMinimalOas())
      const createPet = findOperation(root, 'createPet')

      expect(createPet?.requestBody).toMatchObject({
        description: 'New pet to create',
        required: true,
        content: [{ contentType: 'application/json', schema: { type: 'ref' } }],
      })
      expect(createPet?.requestBody?.content?.[0]?.schema?.optional).toBeFalsy()
    })

    it('leaves requestBody.required undefined when spec omits required', async () => {
      const root = await parseOas(await buildMinimalOas())
      const patchPet = findOperation(root, 'patchPet')

      expect(patchPet?.requestBody).toBeDefined()
      expect(patchPet?.requestBody?.required).toBeUndefined()
      expect(patchPet?.requestBody?.content?.[0]?.schema?.optional).toBe(true)
    })

    it('converts a response with statusCode, description and content, and a body-less response', async () => {
      const root = await parseOas(await buildMinimalOas())
      const ok = findOperation(root, 'listPets')?.responses.find((r) => r.statusCode === '200')

      expect(ok).toMatchObject({
        description: 'A list of pets',
        content: [{ contentType: 'application/json', schema: { type: 'ref' } }],
      })
      expect(findOperation(root, 'getPetById')?.responses.find((r) => r.statusCode === '404')?.description).toBe('Not found')
    })

    it('gives a body-less response an empty content type instead of the request one', async () => {
      const root = await parseOas({
        openapi: '3.0.3',
        info: { title: 't', version: '1' },
        paths: {
          '/markdown/raw': {
            post: {
              operationId: 'renderRaw',
              requestBody: { content: { 'text/plain': { schema: { type: 'string' } } } },
              responses: { '304': { description: 'Not modified' } },
            },
          },
        },
      })
      const notModified = findOperation(root, 'renderRaw')?.responses.find((r) => r.statusCode === '304')

      expect(notModified?.content).toMatchObject([{ contentType: '' }])
    })

    it('types an octet-stream body with a description as a blob', async () => {
      const root = await parseOas({
        openapi: '3.0.3',
        info: { title: 't', version: '1' },
        paths: {
          '/assets': {
            post: {
              operationId: 'uploadAsset',
              requestBody: { content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary', description: 'The asset' } } } },
              responses: { '204': { description: 'ok' } },
            },
          },
        },
      })

      expect(findOperation(root, 'uploadAsset')?.requestBody?.content?.[0]?.schema).toMatchObject({ type: 'blob', description: 'The asset' })
    })

    it('populates requestBody.content with every content type in spec order', async () => {
      const root = await parseOas(multipartUploadDocument)
      const upload = findOperation(root, 'upload')

      expect(upload?.requestBody?.content).toMatchObject([
        { contentType: 'application/json', schema: { type: 'object' } },
        { contentType: 'multipart/form-data', schema: { type: 'object' } },
      ])
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

    it('drops a parameter style outside the OpenAPI set', async () => {
      const root = await parseOas({
        openapi: '3.0.3',
        info: { title: 't', version: '1' },
        paths: {
          '/u': {
            get: {
              operationId: 'badParamStyle',
              parameters: [
                { name: 'a', in: 'query', schema: { type: 'array', items: { type: 'string' } }, style: "x'; throw 1; '", explode: true },
                { name: 'b', in: 'query', schema: { type: 'object' }, style: 'deepObject' },
              ],
              responses: { '204': { description: 'ok' } },
            },
          },
        },
      })
      const parameters = findOperation(root, 'badParamStyle')?.parameters

      expect(parameters?.map((parameter) => [parameter.name, parameter.style])).toStrictEqual([
        ['a', undefined],
        ['b', 'deepObject'],
      ])
    })

    it('drops an encoding style outside the OpenAPI set', async () => {
      const root = await parseOas({
        openapi: '3.0.3',
        info: { title: 't', version: '1' },
        paths: {
          '/u': {
            post: {
              operationId: 'badStyle',
              requestBody: {
                content: {
                  'application/x-www-form-urlencoded': {
                    schema: { type: 'object', properties: { a: { type: 'string' }, b: { type: 'string' } } },
                    encoding: { a: { style: "x'; throw 1; '", explode: true }, b: { style: 'bogus' } },
                  },
                },
              },
              responses: { '204': { description: 'ok' } },
            },
          },
        },
      })

      expect(findOperation(root, 'badStyle')?.requestBody?.content?.[0]?.encoding).toStrictEqual({ a: { explode: true } })
    })

    it('leaves the encoding key off a body without encoding', async () => {
      const root = await parseOas(multipartUploadDocument)
      const content = findOperation(root, 'upload')?.requestBody?.content

      expect(content?.every((entry) => !('encoding' in entry))).toBe(true)
    })

    it('keeps only the configured contentType in requestBody.content', async () => {
      const root = await parseOas(multipartUploadDocument, { contentType: 'multipart/form-data' })
      const upload = findOperation(root, 'upload')

      expect(upload?.requestBody?.content?.map((entry) => entry.contentType)).toStrictEqual(['multipart/form-data'])
    })

    it('keeps a binary response for an application/octet-stream body upgraded to 3.1, whatever emptySchemaType is', async () => {
      const root = await parseOas(binaryResponseDocument)

      expect(findOperation(root, 'downloadEssay')?.responses[0]?.content).toMatchObject([{ contentType: 'application/octet-stream', schema: { type: 'blob' } }])
      expect(findOperation(root, 'downloadPdf')?.responses[0]?.content?.[0]?.schema?.type).toBe('blob')

      const withVoid = await parseOas(binaryResponseDocument, { emptySchemaType: 'void' })
      expect(findOperation(withVoid, 'downloadEssay')?.responses[0]?.content?.[0]?.schema?.type).toBe('blob')
    })

    it('populates response.content with every content type in spec order', async () => {
      const root = await parseOas(multiResponseDocument)
      const ok = findOperation(root, 'getPetById')?.responses.find((r) => r.statusCode === '200')

      expect(ok?.content?.map((entry) => entry.contentType)).toStrictEqual(['application/json', 'application/xml'])
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

  it.each([
    { title: 'reads the OAS 3.1 examples array', schema: { type: 'string', examples: ['a', 'b'] }, examples: ['a', 'b'] },
    { title: 'normalizes a singular OAS 3.0 example into the examples array', schema: { type: 'string', example: 'doggie' }, examples: ['doggie'] },
  ] satisfies Array<{ title: string; schema: SchemaObject; examples: Array<unknown> }>)('$title', ({ schema, examples }) => {
    expect(parseSchema(emptyCtx, { schema }).examples).toStrictEqual(examples)
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

  it.each([
    { title: 'untyped application/octet-stream content', schema: { contentMediaType: 'application/octet-stream' }, type: 'blob' },
    { title: 'string application/octet-stream content', schema: { type: 'string', contentMediaType: 'application/octet-stream' }, type: 'blob' },
    {
      title: 'base64-encoded application/octet-stream content',
      schema: { type: 'string', contentMediaType: 'application/octet-stream', contentEncoding: 'base64' },
      type: 'string',
    },
    { title: 'string text/plain content', schema: { type: 'string', contentMediaType: 'text/plain' }, type: 'string' },
  ] satisfies Array<{ title: string; schema: SchemaObject; type: string }>)('maps $title to $type (OAS 3.1 contentMediaType)', ({ schema, type }) => {
    expect(parseSchema(emptyCtx, { schema }).type).toBe(type)
  })
})

describe('parseSchema metadata', () => {
  it.each([
    { title: 'nullable on a ref', schema: { $ref: '#/components/schemas/Pet', nullable: true }, expected: { type: 'ref', nullable: true } },
    { title: 'nullable on a union', schema: { oneOf: [{ type: 'string' }], nullable: true }, expected: { type: 'union', nullable: true } },
    {
      title: 'description and deprecated on a union',
      schema: { oneOf: [{ type: 'string' }], description: 'one of many', deprecated: true },
      expected: { type: 'union', description: 'one of many', deprecated: true },
    },
    {
      title: 'description and deprecated on an OAS 3.1 type-array union',
      schema: { type: ['string', 'integer'], description: 'id or label', deprecated: true },
      expected: { type: 'union', description: 'id or label', deprecated: true },
    },
  ] satisfies Array<SchemaCase>)('carries $title', ({ schema, expected }) => {
    expect(parseSchema(emptyCtx, { schema })).toMatchObject(expected)
  })

  it.each([
    { title: 'nullable: true (OAS 3.0)', schema: { type: 'string', nullable: true } },
    { title: 'x-nullable: true', schema: { type: 'string', 'x-nullable': true } },
    { title: 'a type array including null (OAS 3.1)', schema: { type: ['string', 'null'] } },
    { title: 'null in the enum values (OAS 3.0 convention)', schema: { enum: ['a', 'b', null] } },
  ] satisfies Array<{ title: string; schema: SchemaObject }>)('sets nullable via $title', ({ schema }) => {
    expect(parseSchema(emptyCtx, { schema }).nullable).toBe(true)
  })
})

describe('parseSchema default', () => {
  it.each([
    { title: 'a falsy-but-non-null number (0)', schema: { type: 'number', default: 0 }, value: 0 },
    { title: 'an enum member', schema: { enum: ['a', 'b'], default: 'a' }, value: 'a' },
  ] satisfies Array<{ title: string; schema: SchemaObject; value: unknown }>)('passes through $title default', ({ schema, value }) => {
    expect(parseSchema(emptyCtx, { schema }).default).toBe(value)
  })

  it('keeps default: null when schema is not nullable', () => {
    const node = parseSchema(emptyCtx, { schema: { type: 'string', default: null } })

    expect(node.default).toBeNull()
  })

  it.each([
    { title: 'a nullable string', schema: { type: 'string', nullable: true, default: null } },
    { title: 'an enum nullable through a null member', schema: { enum: ['a', null], default: null } },
  ] satisfies Array<{ title: string; schema: SchemaObject }>)('drops default: null on $title', ({ schema }) => {
    expect(parseSchema(emptyCtx, { schema }).default).toBeUndefined()
  })
})

describe('parseSchema constraints', () => {
  it.each([
    {
      title: 'minLength and maxLength alongside pattern',
      schema: { type: 'string', pattern: '^[a-z]+$', minLength: 2, maxLength: 10 },
      expected: { type: 'string', pattern: '^[a-z]+$', min: 2, max: 10 },
    },
    {
      title: 'minLength and maxLength on a string int64',
      schema: { type: 'string', format: 'int64', minLength: 1, maxLength: 20 },
      expected: { type: 'string', min: 1, max: 20 },
    },
    { title: 'minItems and maxItems on an array', schema: { type: 'array', minItems: 1, maxItems: 5 }, expected: { type: 'array', min: 1, max: 5 } },
    { title: 'uniqueItems: true on an array', schema: { type: 'array', uniqueItems: true }, expected: { type: 'array', unique: true } },
    { title: 'uniqueItems: false on an array', schema: { type: 'array', uniqueItems: false }, expected: { type: 'array', unique: false } },
    { title: 'minItems on a tuple', schema: { prefixItems: [{ type: 'string' }], minItems: 1 }, expected: { type: 'tuple', min: 1 } },
    { title: 'maxItems on a tuple', schema: { prefixItems: [{ type: 'string' }], maxItems: 4 }, expected: { type: 'tuple', max: 4 } },
    { title: 'numeric exclusiveMinimum on a number', schema: { type: 'number', exclusiveMinimum: 0 }, expected: { type: 'number', exclusiveMinimum: 0 } },
    { title: 'numeric exclusiveMinimum on an integer', schema: { type: 'integer', exclusiveMinimum: 0 }, expected: { type: 'integer', exclusiveMinimum: 0 } },
    {
      title: 'minimum and maximum on a float number',
      schema: { type: 'number', format: 'float', minimum: -90, maximum: 90 },
      expected: { type: 'number', min: -90, max: 90 },
    },
    {
      title: 'minimum and maximum when only the format names the type',
      schema: { format: 'double', minimum: 0, maximum: 1 },
      expected: { type: 'number', min: 0, max: 1 },
    },
    {
      title: 'numeric exclusiveMinimum and exclusiveMaximum on a double number',
      schema: { type: 'number', format: 'double', exclusiveMinimum: 0, exclusiveMaximum: 100 },
      expected: { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 100 },
    },
    {
      title: 'multipleOf on an int64 integer',
      schema: { type: 'integer', format: 'int64', multipleOf: 10 },
      options: { integerType: 'number' },
      expected: { type: 'integer', multipleOf: 10 },
    },
  ] satisfies Array<SchemaCase>)('maps $title', ({ schema, options, expected }) => {
    expect(parseSchema(emptyCtx, { schema }, options)).toMatchObject(expected)
  })

  it.each([
    {
      title: 'a boolean exclusiveMinimum (OAS 3.0 style) on a number',
      schema: { type: 'number', exclusiveMinimum: true },
      type: 'number',
      keys: ['exclusiveMinimum'],
    },
    { title: 'minimum and maximum on a uuid string', schema: { type: 'string', format: 'uuid', minimum: 0, maximum: 1 }, type: 'uuid', keys: ['min', 'max'] },
  ] satisfies Array<{ title: string; schema: SchemaObject; type: string; keys: Array<string> }>)('ignores $title', ({ schema, type, keys }) => {
    const node = parseSchema(emptyCtx, { schema }) as unknown as Record<string, unknown>

    expect(node['type']).toBe(type)
    for (const key of keys) {
      expect(node[key]).toBeUndefined()
    }
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

  it('does not infer array from minItems/maxItems alone', () => {
    const node = parseSchema(emptyCtx, { schema: { minItems: 1, maxItems: 5 } })

    expect(node.type).not.toBe('array')
  })
})

describe('parseSchema pattern', () => {
  it.each([
    { title: 'a number', schema: { type: 'number', pattern: '^[0-9]+$' }, type: 'number' },
    { title: 'a ref sibling', schema: { $ref: '#/components/schemas/Pet', pattern: '^[a-z]+$' }, type: 'ref' },
  ] satisfies Array<{ title: string; schema: SchemaObject; type: string }>)('drops pattern on $title', ({ schema, type }) => {
    const node = parseSchema(emptyCtx, { schema }) as unknown as Record<string, unknown>

    expect(node['type']).toBe(type)
    expect(node['pattern']).toBeUndefined()
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

  it('keeps requiredness from a required-only allOf member next to a $ref', () => {
    const doc = {
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {},
      components: { schemas: { Base: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } } } },
    } as Document
    const node = parseSchema(
      { document: doc, refs: createRefs(doc) },
      { schema: { allOf: [{ $ref: '#/components/schemas/Base' }, { required: ['id', 'name'] }] } },
    )
    const [, object] = ast.narrowSchema(node, 'intersection')?.members ?? []

    expect(ast.narrowSchema(object!, 'object')?.properties?.map((p) => [p.name, p.required, p.schema.type])).toStrictEqual([
      ['id', true, 'string'],
      ['name', true, 'string'],
    ])
  })

  it('drops an if/then allOf member and merges annotation-only members into the parent', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        allOf: [
          { $ref: '#/components/schemas/Base' },
          { if: { properties: { type: { const: 'card' } } }, then: { required: ['card'] } },
          { description: 'hello' },
        ],
      },
    })

    expect(node).toMatchObject({ type: 'ref', description: 'hello' })
  })

  it('appends sibling properties as an extra intersection member', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        allOf: [{ $ref: '#/components/schemas/Pet' }],
        properties: { extra: { type: 'string' } },
      },
    })

    // first member: the $ref, last member: the sibling properties object
    const members = ast.narrowSchema(node, 'intersection')?.members ?? []
    expect(members[0]?.type).toBe('ref')
    expect(members[members.length - 1]?.type).toBe('object')
  })

  it('resolves required keys missing from outer properties by looking into allOf members', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        required: ['id'],
        allOf: [
          { type: 'object', properties: { id: { type: 'integer' } } },
          { type: 'object', properties: { name: { type: 'string' } } },
        ],
      },
    })

    // The 2 anonymous allOf members are merged into 1; the injected required-key member is a separate synthetic member
    const intersection = ast.narrowSchema(node, 'intersection')
    expect(intersection?.members).toHaveLength(2)
    // the merged allOf object contains both id and name
    const mergedAllOf = ast.narrowSchema(intersection?.members?.[0], 'object')
    expect(mergedAllOf?.properties?.map((p) => p.name)).toStrictEqual(['id', 'name'])
    // the injected member is an object with `id` marked required
    const injected = ast.narrowSchema(intersection?.members?.[1], 'object')
    expect(injected?.properties?.find((p) => p.name === 'id')?.required).toBe(true)
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

  it('keeps synthetic object members (injected required-key + outer properties) intact for enum naming', () => {
    // Models the FullAddress pattern:
    //   allOf: [$ref Address]  ← typically a $ref, but here tested with an inline anonymous object
    //   properties: { streetName }
    //   required: [streetName, streetNumber]  ← streetNumber resolved from Address
    //
    // The injected required-key member is now parsed under the parent name (`FullAddress`)
    // so nested enums inside it qualify correctly (e.g. `FullAddressStreetNumberEnum`).
    // That makes the synthetic member non-anonymous, so the lazy adjacent-merge skips it —
    // we keep the three members instead of two. The resulting TypeScript intersection is
    // equivalent at the type level.
    const node = parseSchema(emptyCtx, {
      name: 'FullAddress',
      schema: {
        allOf: [
          {
            type: 'object',
            properties: { streetNumber: { type: 'string' } },
          },
        ],
        properties: { streetName: { type: 'string' } },
        required: ['streetName', 'streetNumber'],
      },
    })

    const intersection = ast.narrowSchema(node, 'intersection')
    expect(intersection?.members).toHaveLength(3)
    const propNames = intersection?.members?.flatMap((m) => ast.narrowSchema(m, 'object')?.properties?.map((p) => p.name) ?? [])
    expect(propNames).toStrictEqual(expect.arrayContaining(['streetNumber', 'streetName']))
  })
})

describe('parseSchema oneOf / anyOf', () => {
  it.each([{ keyword: 'oneOf', strategy: 'one' }] as const)('maps $keyword to a union node with strategy $strategy', ({ keyword, strategy }) => {
    const node = parseSchema(emptyCtx, { schema: { [keyword]: [{ type: 'string' }, { type: 'number' }] } })

    expect(node).toMatchObject({ type: 'union', strategy })
    expect(ast.narrowSchema(node, 'union')?.members?.map((member) => member.type)).toStrictEqual(['string', 'number'])
  })

  it('combines oneOf and anyOf members into a single union with strategy one', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        oneOf: [{ type: 'string' }],
        anyOf: [{ type: 'number' }, { type: 'boolean' }],
      },
    })

    expect(node).toMatchObject({ type: 'union', strategy: 'one' })
    expect(ast.narrowSchema(node, 'union')?.members).toHaveLength(3)
  })

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

  it('does not set discriminatorPropertyName when discriminator is absent', () => {
    const node = parseSchema(emptyCtx, { schema: { oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }] } })

    expect(node.type).toBe('union')
    expect(ast.narrowSchema(node, 'union')?.discriminatorPropertyName).toBeUndefined()
  })

  it('infers discriminatorPropertyName when a property carries a distinct literal per branch', () => {
    // No `discriminator` keyword, and the branches differ beyond that property too.
    const node = parseSchema(emptyCtx, {
      schema: {
        oneOf: [
          { type: 'object', properties: { error: { type: 'string', enum: ['validation_failed'] }, field: { type: 'string' } } },
          { type: 'object', properties: { error: { type: 'string', enum: ['rate_limited'] }, retryAfter: { type: 'integer' } } },
        ],
      },
    })

    expect(ast.narrowSchema(node, 'union')?.discriminatorPropertyName).toBe('error')
  })

  it('does not infer discriminatorPropertyName when no property has a single literal on every branch', () => {
    // `state` is the only shared property, but each branch carries two literal values for it.
    const node = parseSchema(emptyCtx, {
      schema: {
        oneOf: [
          { type: 'object', properties: { state: { type: 'string', enum: ['open', 'reopened'] } } },
          { type: 'object', properties: { state: { type: 'string', enum: ['closed', 'archived'] } } },
        ],
      },
    })

    expect(ast.narrowSchema(node, 'union')?.discriminatorPropertyName).toBeUndefined()
  })

  it.each([
    { title: 'two members', oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }], members: ['ref', 'ref'] },
  ] satisfies Array<{ title: string; oneOf: Array<SchemaObject>; members: Array<string> }>)(
    'intersects a oneOf with $title with the sibling properties when properties are present',
    async ({ oneOf, members }) => {
      const node = parseSchema(emptyCtx, {
        schema: {
          oneOf,
          properties: { id: { type: 'integer' } },
        },
      })

      expect(node.type).toBe('intersection')
      const topIntersection = ast.narrowSchema(node, 'intersection')
      const unionNode = ast.narrowSchema(topIntersection?.members?.[0], 'union')
      const sharedNode = ast.narrowSchema(topIntersection?.members?.[1], 'object')

      expect(unionNode?.members?.map((member) => member.type)).toStrictEqual(members)
      expect(sharedNode?.properties?.map((p) => p.name)).toStrictEqual(['id'])
    },
  )

  describe('required-only union branches', () => {
    it('resolves required-only anyOf branches against sibling properties on the same schema (Example 1)', () => {
      const node = parseSchema(emptyCtx, {
        schema: {
          type: 'object',
          properties: {
            email: { type: 'string' },
            phone: { type: 'string' },
          },
          anyOf: [{ required: ['email'] }, { required: ['phone'] }],
        },
      })

      expect(node.type).toBe('intersection')
      const intersection = ast.narrowSchema(node, 'intersection')!
      const unionNode = ast.narrowSchema(intersection.members?.[0], 'union')
      const sharedNode = ast.narrowSchema(intersection.members?.[1], 'object')

      expect(unionNode).toBeDefined()
      expect(unionNode?.strategy).toBe('any')
      expect(unionNode?.members).toHaveLength(2)

      const branchEmail = ast.narrowSchema(unionNode?.members?.[0], 'object')
      const branchPhone = ast.narrowSchema(unionNode?.members?.[1], 'object')

      expect(branchEmail?.properties).toMatchObject([{ name: 'email', required: true, schema: { type: 'string' } }])
      expect(branchPhone?.properties).toMatchObject([{ name: 'phone', required: true, schema: { type: 'string' } }])

      expect(sharedNode?.properties?.find((p) => p.name === 'email')?.required).toBe(false)
      expect(sharedNode?.properties?.find((p) => p.name === 'phone')?.required).toBe(false)
    })

    it('resolves required-only oneOf branches inside allOf against sibling allOf members including refs (nested composition)', () => {
      const doc: Document = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            BasePayment: {
              type: 'object',
              properties: { provider: { type: 'string' } },
            },
            TokenType: {
              type: 'string',
              enum: ['BEARER', 'JWT'],
            },
          },
        },
      } as Document
      const testCtx = { document: doc, refs: createRefs(doc) }

      const node = parseSchema(testCtx, {
        schema: {
          type: 'object',
          allOf: [
            { $ref: '#/components/schemas/BasePayment' },
            {
              properties: {
                tokenValue: {},
                tokenType: { $ref: '#/components/schemas/TokenType' },
                accountNumber: { type: 'string' },
              },
            },
            {
              oneOf: [{ required: ['tokenValue', 'tokenType'] }, { required: ['accountNumber'] }],
            },
          ],
        },
      })

      expect(node.type).toBe('intersection')
      const intersection = ast.narrowSchema(node, 'intersection')!
      expect(intersection.members).toHaveLength(3)

      const [refMember, objMember, unionMember] = intersection.members!
      expect(refMember?.type).toBe('ref')

      const objNode = ast.narrowSchema(objMember, 'object')
      expect(objNode?.properties?.find((p) => p.name === 'tokenValue')?.required).toBe(false)
      expect(objNode?.properties?.find((p) => p.name === 'tokenType')?.required).toBe(false)
      expect(objNode?.properties?.find((p) => p.name === 'accountNumber')?.required).toBe(false)

      const unionNode = ast.narrowSchema(unionMember, 'union')
      expect(unionNode).toBeDefined()
      expect(unionNode?.strategy).toBe('one')
      expect(unionNode?.members).toHaveLength(2)

      const branch1 = ast.narrowSchema(unionNode?.members?.[0], 'object')
      const branch2 = ast.narrowSchema(unionNode?.members?.[1], 'object')

      expect(branch1?.properties).toMatchObject([
        { name: 'tokenValue', required: true, schema: { type: 'unknown' } },
        { name: 'tokenType', required: true, schema: { type: 'ref' } },
      ])
      expect(branch2?.properties).toMatchObject([{ name: 'accountNumber', required: true, schema: { type: 'string' } }])
    })

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

    it('preserves local properties while borrowing remaining required sibling properties', () => {
      const node = parseSchema(emptyCtx, {
        schema: {
          type: 'object',
          properties: {
            sharedKey: { type: 'number' },
          },
          oneOf: [
            {
              properties: {
                localKey: { type: 'string' },
              },
              required: ['localKey', 'sharedKey'],
            },
          ],
        },
      })

      const intersection = ast.narrowSchema(node, 'intersection')!
      const unionNode = ast.narrowSchema(intersection.members?.[0], 'union')
      const branch = ast.narrowSchema(unionNode?.members?.[0], 'object')

      expect(branch?.properties).toHaveLength(2)
      expect(branch?.properties.find((p) => p.name === 'localKey')).toMatchObject({ required: true, schema: { type: 'string' } })
      expect(branch?.properties.find((p) => p.name === 'sharedKey')).toMatchObject({ required: true, schema: { type: 'number' } })
    })
  })
})

describe('parseSchema discriminator on union', () => {
  it('leaves an array member out of the discriminant intersection', async () => {
    const root = await parseOas({
      openapi: '3.0.3',
      info: { title: 't', version: '1' },
      paths: {},
      components: {
        schemas: {
          Content: {
            oneOf: [{ $ref: '#/components/schemas/ContentDirectory' }, { $ref: '#/components/schemas/ContentFile' }],
            discriminator: { propertyName: 'type', mapping: { array: '#/components/schemas/ContentDirectory', file: '#/components/schemas/ContentFile' } },
          },
          ContentDirectory: { type: 'array', items: { $ref: '#/components/schemas/ContentFile' } },
          ContentFile: { type: 'object', properties: { type: { type: 'string' } }, required: ['type'] },
        },
      },
    })
    const members = ast.narrowSchema(
      root.schemas.find((schema) => schema.name === 'Content'),
      'union',
    )?.members

    expect(members?.map((member) => member.type)).toStrictEqual(['ref', 'intersection'])
  })

  it('narrows the discriminator property to the mapping keys of each union member when a mapping is present', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { $ref: '#/components/schemas/Cat' }],
        discriminator: {
          propertyName: 'type',
          mapping: {
            dog: '#/components/schemas/Dog',
            hound: '#/components/schemas/Dog',
            cat: '#/components/schemas/Cat',
          },
        },
        properties: {
          type: { type: 'string', enum: ['dog', 'hound', 'cat'], readOnly: true },
          name: { type: 'string' },
        },
        required: ['type', 'name'],
      },
    })

    expect(node.type).toBe('intersection')
    const topIntersection = ast.narrowSchema(node, 'intersection')!
    const unionNode = ast.narrowSchema(topIntersection.members?.[0], 'union')!
    const sharedPropertiesNode = ast.narrowSchema(topIntersection.members?.[1], 'object')
    const sharedTypeProp = sharedPropertiesNode?.properties?.find((p) => p.name === 'type')

    expect(ast.narrowSchema(sharedTypeProp?.schema, 'enum')?.enumValues).toStrictEqual(['dog', 'hound', 'cat'])

    const { members } = unionNode

    // Dog member: intersection of Dog ref + synthetic discriminant object { type: 'dog' | 'hound' }, one value per mapping key
    const dogIntersection = ast.narrowSchema(members![0], 'intersection')
    const dogDiscNode = ast.narrowSchema(dogIntersection!.members![1], 'object')
    const dogTypeProp = dogDiscNode?.properties?.find((p) => p.name === 'type')
    expect(dogTypeProp?.schema).toMatchObject({ type: 'enum', readOnly: true, enumValues: ['dog', 'hound'] })

    // Cat member: intersection of Cat ref + synthetic discriminant object { type: 'cat' }
    const catIntersection = ast.narrowSchema(members![1], 'intersection')
    const catDiscNode = ast.narrowSchema(catIntersection!.members![1], 'object')
    const catTypeProp = catDiscNode?.properties?.find((p) => p.name === 'type')
    expect(catTypeProp?.schema).toMatchObject({ type: 'enum', readOnly: true, enumValues: ['cat'] })
  })

  it('gives enum sibling properties a name derived from the union schema name', () => {
    const node = parseSchema(emptyCtx, {
      name: 'Pet',
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { $ref: '#/components/schemas/Cat' }],
        discriminator: {
          propertyName: 'type',
          mapping: {
            dog: '#/components/schemas/Dog',
            cat: '#/components/schemas/Cat',
          },
        },
        properties: {
          type: { type: 'string', enum: ['dog', 'cat'], readOnly: true },
          status: { type: 'string', enum: ['available', 'pending', 'sold'] },
        },
        required: ['type'],
      },
    })

    expect(node.type).toBe('intersection')
    const topIntersection = ast.narrowSchema(node, 'intersection')!
    const sharedPropertiesNode = ast.narrowSchema(topIntersection.members?.[1], 'object')
    const statusProp = sharedPropertiesNode?.properties?.find((p) => p.name === 'status')
    // The enum schema should carry a name derived from the parent union name
    expect(statusProp?.schema.name).toBe('PetStatusEnum')
  })

  it('folds the implicit schema-name value into ref members when no mapping is present', async () => {
    const oas = {
      openapi: '3.0.3',
      info: { title: 'ImplicitDiscriminator', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Pet: {
            oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
            discriminator: { propertyName: 'petType' },
          },
          Cat: { type: 'object', properties: { petType: { type: 'string' }, name: { type: 'string' } } },
          Dog: { type: 'object', properties: { petType: { type: 'string' }, bark: { type: 'boolean' } } },
        },
      },
    }

    const pet = findSchema(await parseOas(oas), 'Pet')
    const { members } = ast.narrowSchema(pet, 'union')!

    const discriminantOf = (member: ast.SchemaNode) => {
      const discNode = ast.narrowSchema(ast.narrowSchema(member, 'intersection')?.members?.[1], 'object')
      return ast.narrowSchema(discNode?.properties?.find((p) => p.name === 'petType')?.schema, 'enum')?.enumValues
    }

    expect(members?.map((member) => member.type)).toStrictEqual(['intersection', 'intersection'])
    expect(discriminantOf(members![0]!)).toStrictEqual(['Cat'])
    expect(discriminantOf(members![1]!)).toStrictEqual(['Dog'])
  })
})

describe('parseSchema const (OAS 3.1)', () => {
  it.each([{ value: 42 }])('maps const $value to a single-value enum', ({ value }) => {
    const node = parseSchema(emptyCtx, { schema: { const: value } })

    expect(node).toMatchObject({ type: 'enum', enumValues: [value] })
  })

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
    { title: 'const: null', schema: { const: null } },
    { title: 'const: null with nullable: true', schema: { const: null, nullable: true } },
    { title: 'a null-only enum (drf-spectacular NullEnum)', schema: { enum: [null] } },
    { title: 'a typed null-only enum', schema: { type: 'string', enum: [null] } },
  ] satisfies Array<{ title: string; schema: SchemaObject }>)('maps $title to a null node without nullable (avoids null | null)', ({ schema }) => {
    const node = parseSchema(emptyCtx, { schema })

    expect(node.type).toBe('null')
    expect(node.nullable).toBeUndefined()
  })

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

describe('parseSchema object properties', () => {
  it.each([
    {
      title: 'required + not nullable',
      required: ['id'],
      property: { type: 'integer' },
      expected: { required: true, optional: undefined, nullish: undefined, nullable: undefined },
    },
    {
      title: 'not required + not nullable',
      required: undefined,
      property: { type: 'string' },
      expected: { required: false, optional: true, nullish: undefined, nullable: undefined },
    },
    {
      title: 'not required + nullable',
      required: undefined,
      property: { type: 'string', nullable: true },
      expected: { required: false, optional: undefined, nullish: true, nullable: true },
    },
    {
      title: 'required + nullable',
      required: ['id'],
      property: { type: 'string', nullable: true },
      expected: { required: true, optional: undefined, nullish: undefined, nullable: true },
    },
  ] satisfies Array<{ title: string; required: Array<string> | undefined; property: SchemaObject; expected: Record<string, unknown> }>)(
    'marks $title as $expected',
    ({ required, property, expected }) => {
      const node = parseSchema(emptyCtx, { schema: { type: 'object', required, properties: { id: property } } })
      const prop = ast.narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'id')

      expect({ required: prop?.required, optional: prop?.schema.optional, nullish: prop?.schema.nullish, nullable: prop?.schema.nullable }).toStrictEqual(
        expected,
      )
    },
  )

  it('treats required: true (OAS 2.0 scalar) as all properties required', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'object',
        // OAS 2.0 allows `required: true` (boolean) on individual properties.
        // Cast simulates an OAS 2.0 spec parsed at runtime where the type diverges from the TS definition.
        required: true as unknown as Array<string>,
        properties: { id: { type: 'integer' }, tag: { type: 'string' } },
      },
    })

    expect(ast.narrowSchema(node, 'object')?.properties.map((p) => [p.name, p.required, p.schema.optional])).toStrictEqual([
      ['id', true, undefined],
      ['tag', true, undefined],
    ])
  })

  it('narrows only the discriminator property to the mapping keys', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'object',
        required: ['petType'],
        properties: {
          petType: { type: 'string' },
          name: { type: 'string' },
        },
        discriminator: {
          propertyName: 'petType',
          mapping: {
            Cat: '#/components/schemas/Cat',
            Dog: '#/components/schemas/Dog',
          },
        },
      },
    })

    expect(ast.narrowSchema(node, 'object')?.properties).toMatchObject([
      { name: 'petType', schema: { type: 'enum', enumValues: ['Cat', 'Dog'] } },
      { name: 'name', schema: { type: 'string' } },
    ])
  })

  it('leaves the discriminator property a string when the discriminator has no mapping', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'object',
        required: ['type'],
        properties: { type: { type: 'string' } },
        discriminator: { propertyName: 'type' },
      },
    })

    expect(ast.narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'type')?.schema.type).toBe('string')
  })
})

describe('parseSchema object additionalProperties', () => {
  it.each([{ title: 'an empty schema (uses unknownType)', additionalProperties: {}, expected: { type: 'unknown' } }] satisfies Array<{
    title: string
    additionalProperties: SchemaObject
    expected: Record<string, unknown>
  }>)('maps additionalProperties with $title to a SchemaNode', ({ additionalProperties, expected }) => {
    const node = parseSchema(emptyCtx, { schema: { type: 'object', additionalProperties } })

    expect(node.type).toBe('object')
    expect(ast.narrowSchema(node, 'object')?.additionalProperties).toMatchObject(expected)
  })

  it('leaves additionalProperties unset for additionalProperties: false', () => {
    const node = parseSchema(emptyCtx, { schema: { type: 'object', additionalProperties: false } })

    expect(ast.narrowSchema(node, 'object')?.additionalProperties).toBeFalsy()
  })

  it('respects unknownType: any for empty additionalProperties', () => {
    const node = parseSchema(emptyCtx, { schema: { type: 'object', additionalProperties: {} } }, { unknownType: 'any' })

    expect(ast.narrowSchema(node, 'object')?.additionalProperties).toMatchObject({ type: 'any' })
  })

  it('keeps properties next to additionalProperties', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
        additionalProperties: { type: 'string' },
      },
    })
    const narrowed = ast.narrowSchema(node, 'object')

    expect(narrowed?.properties?.map((p) => p.name)).toStrictEqual(['id'])
    expect(narrowed?.additionalProperties).toMatchObject({ type: 'string' })
  })
})

describe('parseSchema object patternProperties', () => {
  it('maps patternProperties patterns to converted SchemaNodes', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'object',
        patternProperties: {
          '^S_': { type: 'string' },
          '^I_': { type: 'integer' },
        },
      },
    })
    const narrowed = ast.narrowSchema(node, 'object')

    expect(node.type).toBe('object')
    expect(Object.keys(narrowed?.patternProperties ?? {})).toStrictEqual(['^S_', '^I_'])
    expect(narrowed?.patternProperties).toMatchObject({ '^S_': { type: 'string' }, '^I_': { type: 'integer' } })
  })

  it.each([
    { title: 'an empty pattern schema', pattern: {} },
    // OAS 3.1 / JSON Schema 2020-12 allows boolean schemas for patternProperties values.
    // Cast simulates a `true` boolean schema at runtime where the TS type expects SchemaObject.
    { title: 'a true pattern schema', pattern: true as unknown as SchemaObject },
  ])('falls back to unknownType for $title', ({ pattern }) => {
    const node = parseSchema(emptyCtx, { schema: { type: 'object', patternProperties: { '^x-': pattern } } })

    expect(ast.narrowSchema(node, 'object')?.patternProperties?.['^x-']).toMatchObject({ type: 'unknown' })
  })

  it('keeps properties next to patternProperties', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'object',
        properties: { id: { type: 'integer' } },
        patternProperties: { '^meta_': { type: 'string' } },
      },
    })
    const narrowed = ast.narrowSchema(node, 'object')

    expect(narrowed?.properties?.map((p) => p.name)).toStrictEqual(['id'])
    expect(narrowed?.patternProperties?.['^meta_']).toMatchObject({ type: 'string' })
  })
})

describe('parseSchema prefixItems (tuple)', () => {
  it('maps each prefixItem to a converted items entry in order', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        prefixItems: [{ type: 'string' }, { $ref: '#/components/schemas/Pet' }, { type: 'object', properties: { id: { type: 'integer' } } }],
      },
    })

    expect(ast.narrowSchema(node, 'tuple')?.items?.map((item) => item.type)).toStrictEqual(['string', 'ref', 'object'])
  })

  it.each([
    { title: 'items to rest', items: { type: 'number' }, rest: 'number' },
    { title: 'absent items to an unknownType rest', items: undefined, rest: 'unknown' },
    { title: 'items: true to an unknownType rest', items: true, rest: 'unknown' },
  ] satisfies Array<{ title: string; items: SchemaObject | boolean | undefined; rest: string }>)('maps $title', ({ items, rest }) => {
    const node = parseSchema(emptyCtx, { schema: { prefixItems: [{ type: 'string' }], items } })

    expect(ast.narrowSchema(node, 'tuple')?.rest?.type).toBe(rest)
  })

  it('omits rest when items is false — closed tuple', () => {
    const node = parseSchema(emptyCtx, {
      schema: { prefixItems: [{ type: 'number' }, { type: 'number' }], items: false },
    })
    const narrowed = ast.narrowSchema(node, 'tuple')

    expect(narrowed?.items).toHaveLength(2)
    expect(narrowed?.rest).toBeUndefined()
  })

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
  it('maps enum values to an enum node with enumValues', () => {
    const node = parseSchema(emptyCtx, { schema: { enum: ['foo', 'bar', 'baz'] } })

    expect(node).toMatchObject({ type: 'enum', enumValues: ['foo', 'bar', 'baz'] })
  })

  it('deduplicates string enum values', () => {
    const node = parseSchema(emptyCtx, { schema: { enum: ['a', 'a', 'b'] } })

    expect(ast.narrowSchema(node, 'enum')?.enumValues).toStrictEqual(['a', 'b'])
  })

  it('deduplicates numeric enum values and uses the stringified value as name', () => {
    const namedEnumValues = ast.narrowSchema(parseSchema(emptyCtx, { schema: { type: 'integer', enum: [1, 1, 2] } }), 'enum')?.namedEnumValues

    expect(namedEnumValues?.map((v) => v.value)).toStrictEqual([1, 2])
    expect(namedEnumValues?.map((v) => v.name)).toStrictEqual(['1', '2'])
  })

  it.each([
    { title: 'null in the enum values', schema: { enum: ['a', null, 'b'] }, enumValues: ['a', 'b'] },
    { title: 'null in the enum values combined with nullable', schema: { enum: ['a', null], nullable: true }, enumValues: ['a'] },
    // drf-spectacular splits blank/null choices into `BlankEnum` ({ enum: [''] }) and
    // `NullEnum` ({ enum: [null] }) components, combined with the real enum via `oneOf`.
    { title: 'blank and null together', schema: { enum: ['', null] }, enumValues: [''] },
  ] satisfies Array<{ title: string; schema: SchemaObject; enumValues: Array<unknown> }>)(
    'strips null from enumValues and sets nullable for $title',
    async ({ schema, enumValues }) => {
      const node = parseSchema(emptyCtx, { schema })

      expect(node.nullable).toBe(true)
      expect(ast.narrowSchema(node, 'enum')?.enumValues).toStrictEqual(enumValues)
    },
  )

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

  it.each(['x-enum-varnames'] as const)('uses %s labels as namedEnumValues names', (key) => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'integer',
        enum: [1, 2, 3],
        [key]: ['One', 'Two', 'Three'],
      },
    })
    const values = ast.narrowSchema(node, 'enum')?.namedEnumValues

    expect(values?.map((v) => v.name)).toStrictEqual(['One', 'Two', 'Three'])
    expect(values?.map((v) => v.value)).toStrictEqual([1, 2, 3])
  })

  it('produces namedEnumValues from x-enum-descriptions on a string enum without varnames', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        enum: ['active', 'inactive'],
        'x-enum-descriptions': ['Currently active', 'No longer active'],
      },
    })
    const values = ast.narrowSchema(node, 'enum')?.namedEnumValues

    expect(values?.map((v) => v.name)).toStrictEqual(['active', 'inactive'])
    expect(values?.map((v) => v.description)).toStrictEqual(['Currently active', 'No longer active'])
  })

  it('x-enumNames deduplicates names', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        enum: [1, 2, 3],
        'x-enumNames': ['A', 'A', 'B'],
      },
    })

    expect(ast.narrowSchema(node, 'enum')?.namedEnumValues?.map((v) => v.name)).toStrictEqual(['A', 'B'])
  })

  it('x-enumNames deduplicates by value first, mapping names by deduped index', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'integer',
        enum: [1, 1, 2],
        'x-enumNames': ['First', 'Duplicate', 'Second'],
      },
    })
    const values = ast.narrowSchema(node, 'enum')?.namedEnumValues

    // After deduping values to [1, 2], names are looked up by position in the deduped array
    expect(values?.map((v) => v.name)).toStrictEqual(['First', 'Duplicate'])
    expect(values?.map((v) => v.value)).toStrictEqual([1, 2])
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

  it('drops formatted enum values outside the bounds', () => {
    const node = parseSchema(emptyCtx, { schema: { type: 'integer', format: 'int32', enum: [0, 1, 2], minimum: 1 } })

    expect(ast.narrowSchema(node, 'union')?.members?.map((member) => ast.narrowSchema(member, 'enum')?.enumValues?.[0])).toStrictEqual([1, 2])
  })

  it('x-enumNames keeps each name with its value when bounds drop values', () => {
    const node = parseSchema(emptyCtx, {
      schema: { type: 'integer', enum: [0, 1, 2], minimum: 1, 'x-enumNames': ['Zero', 'One', 'Two'] },
    })
    const values = ast.narrowSchema(node, 'enum')?.namedEnumValues

    expect(values?.map(({ name, value }) => ({ name, value }))).toStrictEqual([
      { name: 'One', value: 1 },
      { name: 'Two', value: 2 },
    ])
  })

  it('x-enumNames falls back to stringified value when fewer names than values', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'integer',
        enum: [10, 20, 30],
        'x-enumNames': ['Ten'],
      },
    })
    const values = ast.narrowSchema(node, 'enum')?.namedEnumValues

    expect(values?.map((v) => v.name)).toStrictEqual(['Ten', '20', '30'])
    expect(values?.map((v) => v.value)).toStrictEqual([10, 20, 30])
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
  it.each([
    { title: 'two non-null types', schema: { type: ['string', 'integer'] }, expected: { type: 'union' }, members: ['string', 'integer'] },
    {
      title: 'null among multiple types',
      schema: { type: ['string', 'integer', 'null'] },
      expected: { type: 'union', nullable: true },
      members: ['string', 'integer'],
    },
    {
      title: 'null leading multiple types with a numeric format',
      schema: { type: ['null', 'integer', 'string'], format: 'int32' },
      expected: { type: 'union', nullable: true },
      members: ['integer', 'string'],
    },
    { title: 'null with a single non-null type', schema: { type: ['string', 'null'] }, expected: { type: 'string', nullable: true } },
    { title: 'null with a single string int64', schema: { type: ['string', 'null'], format: 'int64' }, expected: { type: 'string', nullable: true } },
    { title: 'a single non-null entry', schema: { type: ['integer'] }, expected: { type: 'integer' } },
  ] satisfies Array<SchemaCase & { members?: Array<string> }>)('maps $title', ({ schema, expected, members }) => {
    const node = parseSchema(emptyCtx, { schema })

    expect(node).toMatchObject(expected)
    expect(node.nullable).toBe(expected['nullable'])
    expect(ast.narrowSchema(node, 'union')?.members?.map((member) => member.type)).toStrictEqual(members)
  })

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

  it('converts nested array items recursively', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'array',
        items: { type: 'array', items: { type: 'number' } },
      },
    })

    expect(node).toMatchObject({ type: 'array', items: [{ type: 'array', items: [{ type: 'number' }] }] })
  })

  // Regression for kubb-labs/plugins#132: an array whose items are an object with a nested enum
  // property must keep the object as its items — the enum must not replace the object structure.
  it('keeps array items as an object when the object has a nested enum property', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            type: { type: 'string', enum: ['area', 'density', 'length'] },
            value: { type: 'string' },
          },
          required: ['id', 'type', 'value'],
        },
      },
      name: 'GetPreferencesUnitsStatus200',
    })
    const object = ast.narrowSchema(ast.narrowSchema(node, 'array')?.items?.[0], 'object')

    expect(node.type).toBe('array')
    expect(object?.type).toBe('object')
    expect(object?.properties?.map((p) => p.name)).toStrictEqual(['id', 'type', 'value'])
    expect(ast.narrowSchema(object?.properties?.find((p) => p.name === 'type')?.schema, 'enum')?.enumValues).toStrictEqual(['area', 'density', 'length'])
  })

  it('qualifies inline enums inside single-member allOf with the parent name', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        allOf: [
          {
            type: 'object',
            properties: {
              last_login: {
                type: 'object',
                nullable: true,
                properties: {
                  status: { type: 'string', enum: ['ok', 'failed'] },
                },
              },
            },
          },
        ],
      },
      name: 'GetUser200',
    })
    const ll = ast.narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'last_login')?.schema
    const status = ast.narrowSchema(ll, 'object')?.properties?.[0]?.schema

    expect(status?.name).toBe('GetUser200LastLoginStatusEnum')
  })

  it('qualifies inline enums inside multi-member allOf with the parent name', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        allOf: [
          { type: 'object', properties: { page: { type: 'integer' } } },
          {
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['pending', 'done'] },
                  },
                },
              },
            },
          },
        ],
      },
      name: 'GetTransfers200',
    })
    // Find any deeply-nested status enum to verify its name
    const enums = ast.collectSync(node, {
      schema(n) {
        return ast.narrowSchema(n, 'enum') ?? undefined
      },
    })
    const status = enums.find((e) => e.name?.includes('Status'))

    expect(node.type).toBe('intersection')
    expect(status?.name).toBe('GetTransfers200DataStatusEnum')
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
  describe('emptySchemaType', () => {
    it.each([{ title: 'void for emptySchemaType: void', options: { emptySchemaType: 'void' }, type: 'void' }] satisfies Array<{
      title: string
      options: Partial<ast.ParserOptions> | undefined
      type: string
    }>)('returns $title for an empty schema', async ({ options, type }) => {
      expect(parseSchema(emptyCtx, { schema: {} }, options).type).toBe(type)
    })

    it('preserves metadata (title, description, deprecated, nullable, readOnly, writeOnly, default, examples, format) on a typeless schema', () => {
      const node = parseSchema(
        emptyCtx,
        {
          schema: {
            title: 'Typeless',
            description: 'A schema with metadata but no type',
            deprecated: true,
            readOnly: true,
            writeOnly: false,
            nullable: true,
            default: 'foo',
            example: 'bar',
            format: 'custom-format',
          } as SchemaObject,
        },
        { emptySchemaType: 'any' },
      )

      expect(node).toMatchObject({
        type: 'any',
        title: 'Typeless',
        description: 'A schema with metadata but no type',
        deprecated: true,
        readOnly: true,
        writeOnly: false,
        nullable: true,
        default: 'foo',
        examples: ['bar'],
        format: 'custom-format',
      })
    })

    it('preserves deprecated on typeless object properties', () => {
      const node = parseSchema(emptyCtx, {
        schema: {
          type: 'object',
          properties: {
            oldProp: {
              deprecated: true,
              description: 'Deprecated legacy property',
            },
          },
        } as SchemaObject,
      })

      const prop = ast.narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'oldProp')
      expect(prop?.schema).toMatchObject({ type: 'unknown', deprecated: true, description: 'Deprecated legacy property' })
    })
  })

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

  describe('dateType', () => {
    it.each([
      { title: 'date-time to datetime without offset by default', format: 'date-time', dateType: undefined, expected: { type: 'datetime', offset: false } },
      {
        title: 'date-time to datetime with offset for dateType: stringOffset',
        format: 'date-time',
        dateType: 'stringOffset',
        expected: { type: 'datetime', offset: true },
      },
      {
        title: 'date-time to a local datetime for dateType: stringLocal',
        format: 'date-time',
        dateType: 'stringLocal',
        expected: { type: 'datetime', local: true },
      },
      { title: 'date-time to a Date for dateType: date', format: 'date-time', dateType: 'date', expected: { type: 'date', representation: 'date' } },
      {
        title: 'date-time to a string keeping the format for dateType: false',
        format: 'date-time',
        dateType: false,
        expected: { type: 'string', format: 'date-time' },
      },
      { title: 'date to a date string for dateType: string', format: 'date', dateType: 'string', expected: { type: 'date', representation: 'string' } },
      { title: 'date to a Date for dateType: date', format: 'date', dateType: 'date', expected: { type: 'date', representation: 'date' } },
      { title: 'date to a string for dateType: false', format: 'date', dateType: false, expected: { type: 'string' } },
      { title: 'time to a time string for dateType: string', format: 'time', dateType: 'string', expected: { type: 'time', representation: 'string' } },
      { title: 'time to a Date for dateType: date', format: 'time', dateType: 'date', expected: { type: 'time', representation: 'date' } },
      { title: 'time to a string for dateType: false', format: 'time', dateType: false, expected: { type: 'string' } },
      // Object form: `schemaShape.test.ts` pins the per-format resolution.
      {
        title: 'date-time to a Date for dateType: { dateTime: date }',
        format: 'date-time',
        dateType: { dateTime: 'date' },
        expected: { type: 'date', representation: 'date' },
      },
    ] satisfies Array<{ title: string; format: string; dateType: ast.ParserOptions['dateType'] | undefined; expected: Record<string, unknown> }>)(
      'maps $title',
      async ({ format, dateType, expected }) => {
        const node = parseSchema(emptyCtx, { schema: { type: 'string', format } }, dateType === undefined ? undefined : { dateType })

        expect(node).toMatchObject(expected)
      },
    )
  })
})

describe('parseSchema not keyword', () => {
  it('wraps the schema and its `not` in an intersection', () => {
    const node = parseSchema(emptyCtx, {
      schema: { type: 'string', minLength: 3, not: { $ref: '#/components/schemas/ReservedName' } },
    })

    expect(node).toMatchObject({
      type: 'intersection',
      members: [
        { type: 'string', min: 3 },
        { type: 'not', members: [{ type: 'ref', ref: '#/components/schemas/ReservedName' }] },
      ],
    })
  })

  it('borrows outer properties for a bare `required` list inside `not`', () => {
    const node = parseSchema(emptyCtx, {
      schema: { type: 'object', properties: { query: { type: 'string' }, id: { type: 'string' } }, not: { required: ['query', 'id'] } },
    })
    const notNode = ast.narrowSchema(ast.narrowSchema(node, 'intersection')?.members?.[1], 'not')
    const inner = ast.narrowSchema(notNode?.members?.[0], 'object')

    expect(notNode).not.toBeNull()
    expect(inner?.properties.map((p) => [p.name, p.required, p.schema.type])).toStrictEqual([
      ['query', true, 'string'],
      ['id', true, 'string'],
    ])
  })

  it('keeps a `not` next to a `$ref`', () => {
    const node = parseSchema(emptyCtx, { schema: { $ref: '#/components/schemas/Pet', not: { type: 'null' } } })

    expect(node).toMatchObject({ type: 'intersection', members: [{ type: 'ref', ref: '#/components/schemas/Pet' }, { type: 'not' }] })
  })

  it('keeps a keyword-only `not` as emptySchemaType plus the negation', () => {
    const node = parseSchema(emptyCtx, { schema: { not: { type: 'string' } } })

    expect(node).toMatchObject({ type: 'intersection', members: [{ type: 'unknown' }, { type: 'not', members: [{ type: 'string' }] }] })
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

  it('injects the narrowed discriminant value when the discriminator parent is filtered from allOf', async () => {
    // Cat is identified as 'cat' in Animal's mapping; the Animal $ref is skipped to prevent
    // circularity, but { type: 'cat' } must be injected into Cat's intersection.
    const oas = {
      openapi: '3.0.3',
      info: { title: 'DiscriminantInjection', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Animal: {
            oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
            discriminator: {
              propertyName: 'type',
              mapping: {
                cat: '#/components/schemas/Cat',
                dog: '#/components/schemas/Dog',
              },
            },
          },
          Cat: {
            allOf: [{ $ref: '#/components/schemas/Animal' }, { type: 'object', properties: { name: { type: 'string' } } }],
          },
          Dog: {
            allOf: [{ $ref: '#/components/schemas/Animal' }, { type: 'object', properties: { breed: { type: 'string' } } }],
          },
        },
      },
    }

    const root = await parseOas(oas)

    const discriminantMember = (name: string, value: string) => {
      const schema = findSchema(root, name)
      expect(schema?.type).toBe('intersection')
      // A synthetic { type: value } object must be present in the intersection members.
      return ast.narrowSchema(schema, 'intersection')?.members?.find((m) => {
        const obj = ast.narrowSchema(m, 'object')
        return obj?.properties?.some((p) => p.name === 'type' && ast.narrowSchema(p.schema, 'enum')?.enumValues?.[0] === value)
      })
    }

    expect(discriminantMember('Cat', 'cat')).toBeDefined()
    expect(discriminantMember('Dog', 'dog')).toBeDefined()
  })
})

describe('buildAst – header and cookie parameters', async () => {
  const oas = {
    openapi: '3.0.3',
    info: { title: 'Params', version: '1.0.0' },
    paths: {
      '/items': {
        get: {
          operationId: 'getItems',
          description: 'Fetch a list of items',
          parameters: [
            {
              name: 'X-Request-ID',
              in: 'header',
              required: true,
              schema: { type: 'string', format: 'uuid' },
            },
            {
              name: 'session',
              in: 'cookie',
              required: false,
              schema: { type: 'string' },
            },
            {
              name: 'page',
              in: 'query',
              required: false,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'OK' },
          },
        },
      },
    },
  }

  const getItems = findOperation(await parseOas(oas), 'getItems')

  it.each([
    { name: 'X-Request-ID', in: 'header', required: true, type: 'uuid' },
    { name: 'session', in: 'cookie', required: false, type: 'string' },
  ])('converts $in parameters with in: $in on the described operation', ({ name, in: location, required, type }) => {
    expect(getItems?.description).toBe('Fetch a list of items')
    expect(getItems?.parameters.find((p) => p.name === name)).toMatchObject({ in: location, required, schema: { type } })
  })
})

describe('buildAst – parameter description propagation', () => {
  it('prefers parameter-level description over schema-level description', async () => {
    const oasWithBoth = {
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/items': {
          get: {
            operationId: 'getItems',
            parameters: [
              {
                name: 'q',
                in: 'query',
                description: 'Parameter description',
                required: false,
                schema: { type: 'string', description: 'Schema description' },
              },
            ],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }
    const q = findOperation(await parseOas(oasWithBoth), 'getItems')?.parameters.find((p) => p.name === 'q')

    expect(q?.schema.description).toBe('Parameter description')
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
  const refRequestBodyDocument = {
    openapi: '3.1.0',
    info: { title: 'Test', version: '1.0.0' },
    paths: {
      '/things': {
        post: {
          operationId: 'createThing',
          requestBody: { $ref: '#/components/requestBodies/CreateThingBody' },
          responses: { '200': { description: 'ok' } },
        },
      },
    },
    components: {
      requestBodies: {
        CreateThingBody: {
          description: 'Create a thing',
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' } } },
            },
          },
        },
      },
    },
  } as unknown as Document

  it('merges parameters from a $ref path-item into the operation', async () => {
    const document = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/things': { $ref: '#/components/pathItems/SharedPath' },
      },
      components: {
        pathItems: {
          SharedPath: {
            parameters: [{ $ref: '#/components/parameters/LimitParam' }],
            get: { operationId: 'listThings', responses: { '200': { description: 'ok' } } },
          },
        },
        parameters: {
          LimitParam: { name: 'limit', in: 'query', schema: { type: 'integer' } },
        },
      },
    } as unknown as Document

    const op = findOperation(await parseOas(document), 'listThings')

    expect(op?.parameters).toMatchObject([{ name: 'limit', in: 'query' }])
  })

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

  // Regression test for the global `contentType` option: getRequestBodyMeta used to read
  // operation.schema.requestBody directly, relying on getRequestBodyContentTypes having mutated
  // it first. That mutation was skipped whenever a global `contentType` was set, so a $ref'd
  // requestBody's description/required were silently dropped. refs.deref() resolves
  // independently of that skip.
  it.each([{ title: 'with a global contentType option', contentType: 'application/json' }] satisfies Array<{
    title: string
    contentType: ContentType | undefined
  }>)('resolves description, required and content from a $ref requestBody $title', async ({ contentType }) => {
    const op = findOperation(await parseOas(refRequestBodyDocument, { contentType }), 'createThing')

    expect(op?.requestBody).toMatchObject({
      description: 'Create a thing',
      required: true,
      content: [{ contentType: 'application/json' }],
    })
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

  it('turns the text/event-stream itemSchema into an event union with data typed from contentSchema', async () => {
    const root = await parseOas(
      streamingDocument({
        'text/event-stream': {
          itemSchema: {
            type: 'object',
            required: ['event'],
            properties: { data: { type: 'string' }, event: { type: 'string' }, id: { type: 'string' }, retry: { type: 'integer', minimum: 0 } },
            oneOf: [
              {
                properties: {
                  event: { const: 'message_delta' },
                  data: { contentMediaType: 'application/json', contentSchema: { $ref: '#/components/schemas/MessageDelta' } },
                },
              },
              { properties: { event: { const: 'ping' } } },
            ],
          },
        },
      }),
    )
    const content = firstContent(root)

    expect(content).toMatchObject({ contentType: 'text/event-stream', stream: { shape: 'event' } })
    expect(content?.stream?.schema).toBe(content?.schema)

    const union = ast.narrowSchema(content!.schema!, 'union')
    expect(union?.discriminatorPropertyName).toBe('event')
    const [delta, ping] = union!.members!.map((member) => ast.narrowSchema(member, 'object')!)
    expect(property(delta!, 'event')).toMatchObject({ required: true, schema: { type: 'enum', enumValues: ['message_delta'] } })
    expect(property(delta!, 'data')?.schema).toMatchObject({ type: 'ref', name: 'MessageDelta' })
    expect(property(delta!, 'retry')).toMatchObject({ required: false, schema: { type: 'integer' } })
    expect(property(ping!, 'event')?.schema).toMatchObject({ type: 'enum', enumValues: ['ping'] })
    expect(property(ping!, 'data')?.schema).toMatchObject({ type: 'string' })
  })

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

  it('follows a chain of $ref aliases when reading the event shape', async () => {
    const root = await parseOas({
      ...streamingDocument({ 'text/event-stream': { itemSchema: { $ref: '#/components/schemas/Alias' } } }),
      components: {
        schemas: {
          Alias: { $ref: '#/components/schemas/Event' },
          Event: { type: 'object', properties: { event: { type: 'string' }, data: { type: 'string' } } },
        },
      },
    })

    expect(firstContent(root)).toMatchObject({ schema: { type: 'ref', name: 'Alias' }, stream: { shape: 'event' } })
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

  it('reads schema on a 3.2 text/event-stream entry as the complete stream, not one event', async () => {
    const content = firstContent(await parseOas(streamingDocument({ 'text/event-stream': { schema: { type: 'string' } } })))

    expect(content).toMatchObject({ schema: { type: 'string' }, stream: {} })
    expect(content?.stream).not.toHaveProperty('schema')
  })

  it('shares one item node between schema and stream.schema on an optional request body', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info,
      paths: {
        '/items': {
          post: {
            operationId: 'importItems',
            requestBody: { content: { 'application/jsonl': { itemSchema: { $ref: '#/components/schemas/MessageDelta' } } } },
            responses: { '204': { description: 'Imported' } },
          },
        },
      },
      components: { schemas: { MessageDelta: messageDelta } },
    })
    const content = findOperation(root, 'importItems')?.requestBody?.content?.[0]

    expect(content?.schema).toMatchObject({ type: 'ref', optional: true })
    expect(content?.stream?.schema).toBe(content?.schema)
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

  it.each(['application/jsonl'])('types each %s record from itemSchema', async (contentType) => {
    const content = firstContent(await parseOas(streamingDocument({ [contentType]: { itemSchema: { $ref: '#/components/schemas/MessageDelta' } } })))

    expect(content).toMatchObject({ contentType, schema: { type: 'ref', name: 'MessageDelta' }, stream: { schema: { type: 'ref' } } })
    expect(content?.stream).not.toHaveProperty('shape')
  })

  it('types an empty itemSchema as the empty schema type instead of a blob', async () => {
    const content = firstContent(await parseOas(streamingDocument({ 'application/jsonl': { itemSchema: {} } })))

    expect(content).toMatchObject({ schema: { type: 'unknown' }, stream: { schema: { type: 'unknown' } } })
  })

  it('leaves complete content without the streaming fields', async () => {
    const content = firstContent(await parseOas(streamingDocument({ 'application/json': { schema: { type: 'string' } } })))

    expect(content).toMatchObject({ schema: { type: 'string' } })
    expect(content).not.toHaveProperty('stream')
  })

  it('types a string that holds encoded content as a string, and keeps an enum on it', () => {
    expect(parseSchema(emptyCtx, { schema: { contentMediaType: 'application/json', contentSchema: { type: 'object' } } })).toMatchObject({ type: 'string' })
    expect(parseSchema(emptyCtx, { schema: { contentMediaType: 'text/plain', enum: ['a', 'b'] } })).toMatchObject({ type: 'enum', enumValues: ['a', 'b'] })
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

  it('keeps contentMediaType and the parsed contentSchema on a string schema', async () => {
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
      contentMediaType: 'application/json',
      contentSchema: { type: 'ref', name: 'Pet' },
    })
  })
})

describe('OpenAPI 3.2 responses', () => {
  it('reads the response summary and accepts a response without description', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: { '/pets': { get: { operationId: 'listPets', responses: { '200': { summary: 'The pets' }, '404': {} } } } },
    })

    expect(findOperation(root, 'listPets')?.responses.map(({ statusCode, summary, description }) => ({ statusCode, summary, description }))).toStrictEqual([
      { statusCode: '200', summary: 'The pets', description: undefined },
      { statusCode: '404', summary: undefined, description: undefined },
    ])
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

    expect(root.meta.securitySchemes).toMatchObject([
      {
        name: 'oauth',
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

describe('event stream sentinel', () => {
  it.each(['x-sse-sentinel', 'x-speakeasy-sse-sentinel'])('reads %s on a text/event-stream entry', async (key) => {
    const root = await parseOas({
      openapi: '3.2.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/stream': {
          get: {
            operationId: 'stream',
            responses: { '200': { description: 'OK', content: { 'text/event-stream': { itemSchema: { type: 'string' }, [key]: '[DONE]' } } } },
          },
        },
      },
    })

    expect(findOperation(root, 'stream')?.responses[0]?.content?.[0]?.stream).toMatchObject({ shape: 'data', sentinel: '[DONE]' })
  })
})

describe('OpenAPI 3.2 parameter style and discriminator', () => {
  const info = { title: 'Test', version: '1.0.0' }

  it('keeps the cookie style', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info,
      paths: {
        '/me': {
          get: {
            operationId: 'me',
            parameters: [{ name: 'sid', in: 'cookie', style: 'cookie', schema: { type: 'string' } }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })

    expect(findOperation(root, 'me')?.parameters[0]?.style).toBe('cookie')
  })

  it('adds the defaultMapping member of a discriminator without propertyName', async () => {
    const root = await parseOas({
      openapi: '3.2.0',
      info,
      paths: {},
      components: {
        schemas: {
          Pet: { oneOf: [{ $ref: '#/components/schemas/Dog' }], discriminator: { defaultMapping: 'Other' } },
          Dog: { type: 'object', properties: { kind: { type: 'string' } } },
          Other: { type: 'object', properties: { note: { type: 'string' } } },
        },
      },
    })

    expect(ast.narrowSchema(findSchema(root, 'Pet')!, 'union')?.members).toMatchObject([
      { type: 'ref', name: 'Dog' },
      { type: 'ref', name: 'Other' },
    ])
  })
})
