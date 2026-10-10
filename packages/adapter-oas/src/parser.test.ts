import { ast } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { buildMinimalOas } from '../mocks/oas.ts'
import { DEFAULT_PARSER_OPTIONS } from './constants.ts'
import { patchDiscriminatorNode } from './emit/discriminator/propagate.ts'
import { parseDocument } from './load/normalize.ts'
import { getSchemas } from './model/components.ts'
import { getOperations } from './operation.ts'
import { createSchemaParser, type OasParserContext } from './parser.ts'
import { createRefs } from './refs.ts'
import type { ContentType, Document, SchemaObject } from './types.ts'

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
 * `createSchemaParser().parseSchema` helper for single-schema test cases.
 */
function parseSchema(ctx: OasParserContext, { schema, name }: { schema: SchemaObject; name?: string }, options?: Partial<ast.ParserOptions>): ast.SchemaNode {
  return createSchemaParser(ctx).parseSchema({ schema, name }, options)
}

/**
 * Parses a full OpenAPI document into Kubb's universal `InputNode` AST, mirroring
 * `parseInput()` in `adapter.ts` for whole-spec test cases.
 */
function parseOas(document: Document, options: Partial<ast.ParserOptions> & { contentType?: ContentType } = {}): ast.InputNode {
  const { contentType, ...parserOptions } = options
  const mergedOptions: ast.ParserOptions = {
    ...DEFAULT_PARSER_OPTIONS,
    ...parserOptions,
  }

  const refs = createRefs(document)
  const { schemas: schemaObjects } = getSchemas(document, { contentType }, refs)
  const { parseSchema: _parseSchema, parseOperation: _parseOperation } = createSchemaParser({ document, refs, contentType })

  const schemas: Array<ast.SchemaNode> = Object.entries(schemaObjects).map(([name, schema]) => _parseSchema({ schema, name }, mergedOptions))

  const operations: Array<ast.OperationNode> = getOperations(document, refs)
    .map((operation) => _parseOperation(mergedOptions, operation))
    .filter((op): op is ast.OperationNode => op !== null)

  const root = ast.factory.createInput({ schemas, operations })

  return root
}

function findSchema(root: ast.InputNode, name: string): ast.SchemaNode | undefined {
  return root.schemas.find((schema) => schema.name === name)
}

function findOperation(root: ast.InputNode, operationId: string): ast.OperationNode | undefined {
  return root.operations.find((operation) => operation.operationId === operationId)
}

describe('buildAst', () => {
  describe('schemas', () => {
    it('returns an InputNode with the named component schemas', async () => {
      const root = parseOas(await buildMinimalOas())
      const names = root.schemas.map((s) => s.name)

      expect(root.kind).toBe('Input')
      expect(names).toStrictEqual(expect.arrayContaining(['Pet', 'NewPet', 'Error']))
    })

    it('converts object schema with properties', async () => {
      const root = parseOas(await buildMinimalOas())
      const pet = ast.narrowSchema(findSchema(root, 'Pet'), 'object')

      expect(pet?.type).toBe('object')
      expect(pet?.properties?.map((p) => p.name)).toStrictEqual(expect.arrayContaining(['id', 'name', 'tag']))
    })

    it('marks required properties', async () => {
      const root = parseOas(await buildMinimalOas())
      const pet = ast.narrowSchema(findSchema(root, 'Pet'), 'object')

      expect(pet?.properties?.find((p) => p.name === 'id')?.required).toBe(true)
      expect(pet?.properties?.find((p) => p.name === 'tag')?.required).toBe(false)
    })

    it('converts array schema', async () => {
      const root = parseOas(await buildMinimalOas())
      const list = ast.narrowSchema(findSchema(root, 'PetList'), 'array')

      expect(list?.type).toBe('array')
      expect(list?.items).toHaveLength(1)
      expect(list?.items?.[0]?.type).toBe('ref')
    })

    it('populates node.schema with the resolved ref schema when the document contains the definition', async () => {
      const root = parseOas(await buildMinimalOas())
      const petList = ast.narrowSchema(findSchema(root, 'PetList'), 'array')

      expect(petList?.items?.[0]).toMatchObject({ type: 'ref', schema: { type: 'object' } })
    })

    it('converts enum schema', async () => {
      const root = parseOas(await buildMinimalOas())
      const status = ast.narrowSchema(findSchema(root, 'Status'), 'enum')

      expect(status).toMatchObject({ type: 'enum', primitive: 'string', enumValues: ['active', 'inactive', 'pending'] })
    })

    it('converts oneOf to union', async () => {
      const root = parseOas(await buildMinimalOas())
      const petOrError = ast.narrowSchema(findSchema(root, 'PetOrError'), 'union')

      expect(petOrError?.type).toBe('union')
      expect(petOrError?.members).toHaveLength(2)
    })

    it('parses a drf-spectacular NullEnum component as a null node', () => {
      const root = parseOas({
        openapi: '3.0.3',
        info: { title: '', version: '' },
        paths: {},
        components: { schemas: { NullEnum: { enum: [null] } } },
      } as unknown as Document)

      expect(findSchema(root, 'NullEnum')?.type).toBe('null')
    })

    it('converts allOf to intersection', async () => {
      const root = parseOas(await buildMinimalOas())
      const fullPet = ast.narrowSchema(findSchema(root, 'FullPet'), 'intersection')

      expect(fullPet?.type).toBe('intersection')
      expect(fullPet?.members).toHaveLength(2)
    })

    it('flattens single-member allOf and propagates nullable', async () => {
      const root = parseOas(await buildMinimalOas())

      // Flattened to 'string', not an intersection
      expect(findSchema(root, 'NullableString')).toMatchObject({ type: 'string', nullable: true, readOnly: true, examples: ['some-value'] })
    })

    it('flattens single-member allOf for nullable $ref', async () => {
      const root = parseOas(await buildMinimalOas())
      const nullableRef = ast.narrowSchema(findSchema(root, 'NullableRef'), 'union')

      // The 3.1 upgrade rewrites `{ $ref, nullable: true }` into `anyOf: [$ref, null]`, so the
      // single-member allOf flattens to that union instead of a ref carrying `nullable`.
      expect(nullableRef?.type).toBe('union')
      expect(nullableRef?.members?.map((member) => member.type)).toStrictEqual(['ref', 'null'])
      expect(ast.narrowSchema(nullableRef?.members?.[0], 'ref')?.ref).toBe('#/components/schemas/Pet')
    })

    it('maps formats on properties nested inside an allOf member', async () => {
      const root = parseOas(await buildMinimalOas())
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
      paths: {},
      components: { schemas: { Pet: { type: 'object', properties: { id: { type: 'integer' } } } } },
    } as Document

    it.each([
      { title: 'a ref node for a defined component', $ref: '#/components/schemas/Pet', type: 'ref' },
      { title: 'unknown for a component the document never defines', $ref: '#/components/schemas/Missing', type: 'unknown' },
    ])('returns $title', ({ $ref, type }) => {
      const node = parseSchema({ document, refs: createRefs(document) }, { schema: { $ref } })

      expect(node.type).toBe(type)
    })
  })

  describe('operations', () => {
    it('converts all operations', async () => {
      const root = parseOas(await buildMinimalOas())

      expect(root.operations).toHaveLength(4)
    })

    it('sets operationId, method, path, tags', async () => {
      const root = parseOas(await buildMinimalOas())

      expect(findOperation(root, 'listPets')).toMatchObject({
        method: 'GET',
        path: '/pets',
        protocol: 'http',
        tags: ['pets'],
        summary: 'List all pets',
      })
    })

    it('sets deprecated flag', async () => {
      const root = parseOas(await buildMinimalOas())

      expect(findOperation(root, 'createPet')?.deprecated).toBe(true)
    })

    it('uses uppercase HTTP method per RFC 9110', async () => {
      const root = parseOas(await buildMinimalOas())

      for (const op of root.operations) {
        expect(op.method).toBe(op.method?.toUpperCase())
      }
    })

    it.each([
      { operationId: 'listPets', method: 'GET', path: '/pets', name: 'limit', in: 'query', required: false },
      { operationId: 'getPetById', method: 'GET', path: '/pets/{petId}', name: 'petId', in: 'path', required: true },
    ])('converts $in parameters', async ({ operationId, method, path, name, in: location, required }) => {
      const root = parseOas(await buildMinimalOas())
      const operation = findOperation(root, operationId)
      const parameter = operation?.parameters.find((p) => p.name === name)

      expect(operation).toMatchObject({ method, path })
      expect(parameter).toMatchObject({ in: location, required, schema: { type: 'integer' } })
    })

    it('converts path parameters with $ref schema to a named ref type', async () => {
      const oas = await parseDocument({
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
      })
      const root = parseOas(oas)
      const petId = findOperation(root, 'getPetById')?.parameters.find((p) => p.name === 'petId')

      expect(petId?.schema).toMatchObject({ type: 'ref', name: 'PetId' })
    })

    it('captures the parameter style and explode metadata', async () => {
      const oas = await parseDocument({
        openapi: '3.0.3',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/pets/{ids}': {
            get: {
              operationId: 'listPetsByIds',
              parameters: [
                { name: 'ids', in: 'path', required: true, style: 'matrix', explode: true, schema: { type: 'array', items: { type: 'integer' } } },
                { name: 'tags', in: 'query', style: 'spaceDelimited', explode: false, schema: { type: 'array', items: { type: 'string' } } },
              ],
              responses: { '200': { description: 'OK' } },
            },
          },
        },
      })
      const root = parseOas(oas)
      const op = findOperation(root, 'listPetsByIds')

      expect(op?.parameters.find((p) => p.name === 'ids')).toMatchObject({ style: 'matrix', explode: true })
      expect(op?.parameters.find((p) => p.name === 'tags')).toMatchObject({ style: 'spaceDelimited', explode: false })
    })

    it('converts requestBody with description, required and a single content entry', async () => {
      const root = parseOas(await buildMinimalOas())
      const createPet = findOperation(root, 'createPet')

      expect(createPet?.requestBody).toMatchObject({
        description: 'New pet to create',
        required: true,
        content: [{ contentType: 'application/json', schema: { type: 'ref' } }],
      })
      expect(createPet?.requestBody?.content?.[0]?.schema?.optional).toBeFalsy()
    })

    it('leaves requestBody.required undefined when spec omits required', async () => {
      const root = parseOas(await buildMinimalOas())
      const patchPet = findOperation(root, 'patchPet')

      expect(patchPet?.requestBody).toBeDefined()
      expect(patchPet?.requestBody?.required).toBeUndefined()
      expect(patchPet?.requestBody?.content?.[0]?.schema?.optional).toBe(true)
    })

    it('converts a response with statusCode, description and a single content entry', async () => {
      const root = parseOas(await buildMinimalOas())
      const ok = findOperation(root, 'listPets')?.responses.find((r) => r.statusCode === '200')

      expect(ok).toMatchObject({
        description: 'A list of pets',
        content: [{ contentType: 'application/json', schema: { type: 'ref' } }],
      })
    })

    it('converts responses without a body schema', async () => {
      const root = parseOas(await buildMinimalOas())
      const notFound = findOperation(root, 'getPetById')?.responses.find((r) => r.statusCode === '404')

      expect(notFound?.description).toBe('Not found')
    })

    it('populates requestBody.content with every content type in spec order', async () => {
      const root = parseOas(await parseDocument(multipartUploadDocument))
      const upload = findOperation(root, 'upload')

      expect(upload?.requestBody?.content).toMatchObject([
        { contentType: 'application/json', schema: { type: 'object' } },
        { contentType: 'multipart/form-data', schema: { type: 'object' } },
      ])
    })

    it('keeps only the configured contentType in requestBody.content', async () => {
      const root = parseOas(await parseDocument(multipartUploadDocument), { contentType: 'multipart/form-data' })
      const upload = findOperation(root, 'upload')

      expect(upload?.requestBody?.content?.map((entry) => entry.contentType)).toStrictEqual(['multipart/form-data'])
    })

    it('keeps a binary requestBody for an application/octet-stream body upgraded to 3.1', async () => {
      const oas = await parseDocument({
        openapi: '3.0.3',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/pet/{petId}/uploadImage': {
            post: {
              operationId: 'uploadFile',
              requestBody: {
                required: true,
                content: {
                  'application/octet-stream': {
                    schema: { type: 'string', format: 'binary' },
                  },
                },
              },
              responses: { '200': { description: 'successful operation' } },
            },
          },
        },
      })
      const root = parseOas(oas)
      const uploadFile = findOperation(root, 'uploadFile')

      expect(uploadFile?.requestBody?.content).toMatchObject([{ contentType: 'application/octet-stream', schema: { type: 'blob' } }])
    })

    it('keeps a binary multipart property upgraded to 3.1', async () => {
      const oas = await parseDocument({
        openapi: '3.0.3',
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/upload': {
            post: {
              operationId: 'upload',
              requestBody: {
                required: true,
                content: {
                  'multipart/form-data': {
                    schema: {
                      type: 'object',
                      required: ['file'],
                      properties: { file: { type: 'string', format: 'binary' } },
                    },
                  },
                },
              },
              responses: { '204': { description: 'Uploaded' } },
            },
          },
        },
      })
      const root = parseOas(oas)
      const body = ast.narrowSchema(findOperation(root, 'upload')?.requestBody?.content?.[0]?.schema, 'object')

      expect(body?.properties.find((property) => property.name === 'file')?.schema.type).toBe('blob')
    })

    it('keeps a binary response for an application/octet-stream body upgraded to 3.1', async () => {
      const root = parseOas(await parseDocument(binaryResponseDocument))

      expect(findOperation(root, 'downloadEssay')?.responses[0]?.content).toMatchObject([{ contentType: 'application/octet-stream', schema: { type: 'blob' } }])
      expect(findOperation(root, 'downloadPdf')?.responses[0]?.content?.[0]?.schema?.type).toBe('blob')
    })

    it('keeps a binary octet-stream response whatever emptySchemaType is configured', async () => {
      const root = parseOas(await parseDocument(binaryResponseDocument), { emptySchemaType: 'void' })

      expect(findOperation(root, 'downloadEssay')?.responses[0]?.content?.[0]?.schema?.type).toBe('blob')
    })

    it('populates response.content with every content type in spec order', async () => {
      const root = parseOas(await parseDocument(multiResponseDocument))
      const ok = findOperation(root, 'getPetById')?.responses.find((r) => r.statusCode === '200')

      expect(ok?.content?.map((entry) => entry.contentType)).toStrictEqual(['application/json', 'application/xml'])
    })

    it('keeps only the configured contentType in response.content', async () => {
      const root = parseOas(await parseDocument(multiResponseDocument), { contentType: 'application/xml' })
      const ok = findOperation(root, 'getPetById')?.responses.find((r) => r.statusCode === '200')

      expect(ok?.content?.map((entry) => entry.contentType)).toStrictEqual(['application/xml'])
    })
  })
})

describe('parseSchema types', () => {
  it.each([
    { schema: { type: 'string' }, type: 'string' },
    { schema: { type: 'boolean' }, type: 'boolean' },
    { schema: { type: 'integer' }, type: 'integer' },
    { schema: { type: 'number' }, type: 'number' },
    { schema: { type: 'null' }, type: 'null' },
    { schema: { type: 'array' }, type: 'array' },
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
    { title: 'string idn-email', schema: { type: 'string', format: 'idn-email' }, expected: { type: 'email', format: 'idn-email' } },
    { title: 'email without type', schema: { format: 'email' }, expected: { type: 'email', format: 'email' } },
    { title: 'ipv4 without type', schema: { format: 'ipv4' }, expected: { type: 'ipv4', format: 'ipv4' } },
    { title: 'ipv6 without type', schema: { format: 'ipv6' }, expected: { type: 'ipv6', format: 'ipv6' } },
    { title: 'string uri', schema: { type: 'string', format: 'uri' }, expected: { type: 'url', format: 'uri' } },
    { title: 'string uri-reference', schema: { type: 'string', format: 'uri-reference' }, expected: { type: 'url', format: 'uri-reference' } },
    { title: 'string url', schema: { type: 'string', format: 'url' }, expected: { type: 'url', format: 'url' } },
    { title: 'string hostname', schema: { type: 'string', format: 'hostname' }, expected: { type: 'url', format: 'hostname' } },
    { title: 'string idn-hostname', schema: { type: 'string', format: 'idn-hostname' }, expected: { type: 'url', format: 'idn-hostname' } },
    { title: 'uri without type', schema: { format: 'uri' }, expected: { type: 'url', format: 'uri' } },
    { title: 'string binary', schema: { type: 'string', format: 'binary' }, expected: { type: 'blob', format: 'binary' } },
    { title: 'string byte', schema: { type: 'string', format: 'byte' }, expected: { type: 'blob', format: 'byte' } },
    { title: 'binary without type', schema: { format: 'binary' }, expected: { type: 'blob', format: 'binary' } },
    { title: 'string date-time', schema: { type: 'string', format: 'date-time' }, expected: { type: 'datetime', format: 'date-time' } },
    { title: 'integer int32', schema: { type: 'integer', format: 'int32' }, expected: { type: 'integer', format: 'int32' } },
    { title: 'integer int64 (default integerType bigint)', schema: { type: 'integer', format: 'int64' }, expected: { type: 'bigint', format: 'int64' } },
    { title: 'integer uint64 (default integerType bigint)', schema: { type: 'integer', format: 'uint64' }, expected: { type: 'bigint', format: 'uint64' } },
    { title: 'int64 without type', schema: { format: 'int64' }, expected: { type: 'bigint', format: 'int64' } },
    { title: 'uint64 without type', schema: { format: 'uint64' }, expected: { type: 'bigint', format: 'uint64' } },
    { title: 'number float', schema: { type: 'number', format: 'float' }, expected: { type: 'number', format: 'float' } },
    { title: 'number double', schema: { type: 'number', format: 'double' }, expected: { type: 'number', format: 'double' } },
    { title: 'float without type', schema: { format: 'float' }, expected: { type: 'number', format: 'float' } },
    { title: 'string with an unknown format', schema: { type: 'string', format: 'custom-format' }, expected: { type: 'string', format: 'custom-format' } },
    { title: 'enum with a format', schema: { type: 'string', format: 'custom-enum', enum: ['a', 'b'] }, expected: { type: 'enum', format: 'custom-enum' } },
    // A numeric format on a `type: 'string'` schema describes how the number is spelled, so the declared type wins.
    { title: 'string int64', schema: { type: 'string', format: 'int64' }, expected: { type: 'string', format: 'int64' } },
    { title: 'string uint64', schema: { type: 'string', format: 'uint64' }, expected: { type: 'string', format: 'uint64' } },
    { title: 'string int32', schema: { type: 'string', format: 'int32' }, expected: { type: 'string', format: 'int32' } },
    { title: 'string float', schema: { type: 'string', format: 'float' }, expected: { type: 'string', format: 'float' } },
    { title: 'string double', schema: { type: 'string', format: 'double' }, expected: { type: 'string', format: 'double' } },
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
    { title: 'nullable on a string', schema: { type: 'string', nullable: true }, expected: { type: 'string', nullable: true } },
    { title: 'nullable on a boolean', schema: { type: 'boolean', nullable: true }, expected: { type: 'boolean', nullable: true } },
    { title: 'nullable on an integer', schema: { type: 'integer', nullable: true }, expected: { type: 'integer', nullable: true } },
    { title: 'nullable on a number', schema: { type: 'number', nullable: true }, expected: { type: 'number', nullable: true } },
    { title: 'nullable on an object', schema: { type: 'object', nullable: true }, expected: { type: 'object', nullable: true } },
    { title: 'nullable on an array', schema: { type: 'array', nullable: true }, expected: { type: 'array', nullable: true } },
    { title: 'nullable on a uuid', schema: { type: 'string', format: 'uuid', nullable: true }, expected: { type: 'uuid', nullable: true } },
    { title: 'nullable on an email', schema: { type: 'string', format: 'email', nullable: true }, expected: { type: 'email', nullable: true } },
    { title: 'nullable on a url', schema: { type: 'string', format: 'uri', nullable: true }, expected: { type: 'url', nullable: true } },
    {
      title: 'nullable on a pattern string',
      schema: { type: 'string', pattern: '^[a-z]+$', nullable: true },
      expected: { type: 'string', pattern: '^[a-z]+$', nullable: true },
    },
    { title: 'nullable on a ref', schema: { $ref: '#/components/schemas/Pet', nullable: true }, expected: { type: 'ref', nullable: true } },
    { title: 'nullable on a union', schema: { oneOf: [{ type: 'string' }], nullable: true }, expected: { type: 'union', nullable: true } },
    // An allOf of plain scalar fragments is merged into the parent before conversion, so the
    // node takes the first member's type instead of becoming an intersection.
    {
      title: 'nullable on an allOf of plain scalars',
      schema: { allOf: [{ type: 'string' }, { type: 'number' }], nullable: true },
      expected: { type: 'string', nullable: true },
    },
    {
      title: 'description on a uuid',
      schema: { type: 'string', format: 'uuid', description: 'A unique identifier' },
      expected: { type: 'uuid', description: 'A unique identifier' },
    },
    { title: 'description on a null', schema: { type: 'null', description: 'always null' }, expected: { type: 'null', description: 'always null' } },
    { title: 'readOnly on a string', schema: { type: 'string', readOnly: true }, expected: { type: 'string', readOnly: true } },
    { title: 'readOnly on an object', schema: { type: 'object', readOnly: true }, expected: { type: 'object', readOnly: true } },
    { title: 'readOnly on an enum', schema: { enum: ['a', 'b'], readOnly: true }, expected: { type: 'enum', readOnly: true } },
    { title: 'readOnly on a ref', schema: { $ref: '#/components/schemas/Pet', readOnly: true }, expected: { type: 'ref', readOnly: true } },
    { title: 'writeOnly on a string', schema: { type: 'string', writeOnly: true }, expected: { type: 'string', writeOnly: true } },
    { title: 'writeOnly on an array', schema: { type: 'array', writeOnly: true }, expected: { type: 'array', writeOnly: true } },
    { title: 'deprecated on a string', schema: { type: 'string', deprecated: true }, expected: { type: 'string', deprecated: true } },
    { title: 'deprecated on an object', schema: { type: 'object', deprecated: true }, expected: { type: 'object', deprecated: true } },
    { title: 'deprecated on an array', schema: { type: 'array', deprecated: true }, expected: { type: 'array', deprecated: true } },
    { title: 'deprecated on an enum', schema: { enum: ['a', 'b'], deprecated: true }, expected: { type: 'enum', deprecated: true } },
    { title: 'deprecated on a ref', schema: { $ref: '#/components/schemas/Pet', deprecated: true }, expected: { type: 'ref', deprecated: true } },
    {
      title: 'description and deprecated on a union',
      schema: { oneOf: [{ type: 'string' }], description: 'one of many', deprecated: true },
      expected: { type: 'union', description: 'one of many', deprecated: true },
    },
    {
      title: 'description and deprecated on an allOf of plain scalars',
      schema: { allOf: [{ type: 'string' }, { type: 'number' }], description: 'combined', deprecated: true },
      expected: { type: 'string', description: 'combined', deprecated: true },
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
    { title: 'a string', schema: { type: 'string', default: 'hello' }, value: 'hello' },
    { title: 'a falsy-but-non-null number (0)', schema: { type: 'number', default: 0 }, value: 0 },
    { title: 'a falsy-but-non-null boolean (false)', schema: { type: 'boolean', default: false }, value: false },
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
    { title: 'a nullable enum', schema: { enum: ['a', 'b'], nullable: true, default: null } },
    { title: 'an enum nullable through a null member', schema: { enum: ['a', null], default: null } },
    { title: 'a nullable ref sibling', schema: { $ref: '#/components/schemas/Pet', nullable: true, default: null } },
  ] satisfies Array<{ title: string; schema: SchemaObject }>)('drops default: null on $title', ({ schema }) => {
    expect(parseSchema(emptyCtx, { schema }).default).toBeUndefined()
  })
})

describe('parseSchema constraints', () => {
  it.each([
    { title: 'minLength on a string', schema: { type: 'string', minLength: 1 }, expected: { type: 'string', min: 1 } },
    { title: 'maxLength on a string', schema: { type: 'string', maxLength: 100 }, expected: { type: 'string', max: 100 } },
    { title: 'minLength and maxLength on a string', schema: { type: 'string', minLength: 1, maxLength: 100 }, expected: { type: 'string', min: 1, max: 100 } },
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
    { title: 'minItems on an array', schema: { type: 'array', minItems: 1 }, expected: { type: 'array', min: 1 } },
    { title: 'maxItems on an array', schema: { type: 'array', maxItems: 5 }, expected: { type: 'array', max: 5 } },
    { title: 'minItems and maxItems on an array', schema: { type: 'array', minItems: 1, maxItems: 5 }, expected: { type: 'array', min: 1, max: 5 } },
    { title: 'uniqueItems: true on an array', schema: { type: 'array', uniqueItems: true }, expected: { type: 'array', unique: true } },
    { title: 'uniqueItems: false on an array', schema: { type: 'array', uniqueItems: false }, expected: { type: 'array', unique: false } },
    { title: 'minItems on a tuple', schema: { prefixItems: [{ type: 'string' }], minItems: 1 }, expected: { type: 'tuple', min: 1 } },
    { title: 'maxItems on a tuple', schema: { prefixItems: [{ type: 'string' }], maxItems: 4 }, expected: { type: 'tuple', max: 4 } },
    { title: 'a zero minimum on a number', schema: { type: 'number', minimum: 0 }, expected: { type: 'number', min: 0 } },
    { title: 'maximum on a number', schema: { type: 'number', maximum: 999 }, expected: { type: 'number', max: 999 } },
    { title: 'minimum and maximum on a number', schema: { type: 'number', minimum: 1, maximum: 100 }, expected: { type: 'number', min: 1, max: 100 } },
    { title: 'numeric exclusiveMinimum on a number', schema: { type: 'number', exclusiveMinimum: 0 }, expected: { type: 'number', exclusiveMinimum: 0 } },
    { title: 'numeric exclusiveMaximum on a number', schema: { type: 'number', exclusiveMaximum: 100 }, expected: { type: 'number', exclusiveMaximum: 100 } },
    { title: 'minimum on an integer', schema: { type: 'integer', minimum: 1 }, expected: { type: 'integer', min: 1 } },
    { title: 'maximum on an integer', schema: { type: 'integer', maximum: 100 }, expected: { type: 'integer', max: 100 } },
    { title: 'minimum and maximum on an integer', schema: { type: 'integer', minimum: 1, maximum: 100 }, expected: { type: 'integer', min: 1, max: 100 } },
    { title: 'numeric exclusiveMinimum on an integer', schema: { type: 'integer', exclusiveMinimum: 0 }, expected: { type: 'integer', exclusiveMinimum: 0 } },
    {
      title: 'numeric exclusiveMaximum on an integer',
      schema: { type: 'integer', exclusiveMaximum: 100 },
      expected: { type: 'integer', exclusiveMaximum: 100 },
    },
    {
      title: 'minimum and maximum on a float number',
      schema: { type: 'number', format: 'float', minimum: -90, maximum: 90 },
      expected: { type: 'number', min: -90, max: 90 },
    },
    {
      title: 'minimum and maximum on a double number',
      schema: { type: 'number', format: 'double', minimum: -90, maximum: 90 },
      expected: { type: 'number', min: -90, max: 90 },
    },
    {
      title: 'minimum and maximum on an int32 integer',
      schema: { type: 'integer', format: 'int32', minimum: 1, maximum: 100 },
      expected: { type: 'integer', min: 1, max: 100 },
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
    { title: 'multipleOf on a double number', schema: { type: 'number', format: 'double', multipleOf: 0.5 }, expected: { type: 'number', multipleOf: 0.5 } },
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
    {
      title: 'a boolean exclusiveMinimum (OAS 3.0 style) on an integer',
      schema: { type: 'integer', exclusiveMinimum: true },
      type: 'integer',
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
    { title: 'string from minLength', schema: { minLength: 1 }, expected: { type: 'string', min: 1 } },
    { title: 'string from maxLength', schema: { maxLength: 100 }, expected: { type: 'string', max: 100 } },
    { title: 'string from minLength and maxLength', schema: { minLength: 2, maxLength: 50 }, expected: { type: 'string', min: 2, max: 50 } },
    { title: 'string from pattern', schema: { pattern: '^[0-9]+$' }, expected: { type: 'string', pattern: '^[0-9]+$' } },
    {
      title: 'string from an unknown format with minLength',
      schema: { format: 'custom-format', minLength: 1 },
      expected: { type: 'string', format: 'custom-format' },
    },
    { title: 'number from minimum', schema: { minimum: 0 }, expected: { type: 'number', min: 0 } },
    { title: 'number from maximum', schema: { maximum: 999 }, expected: { type: 'number', max: 999 } },
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
  it('maps pattern on a string type to a string node with pattern', () => {
    const node = parseSchema(emptyCtx, { schema: { type: 'string', pattern: '^[a-z]+$' } })

    expect(node).toMatchObject({ type: 'string', pattern: '^[a-z]+$' })
  })

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
    { title: 'string member', schema: { allOf: [{ type: 'string' }] }, expected: { type: 'string' } },
    { title: '$ref member and nullable', schema: { allOf: [{ $ref: '#/components/schemas/Pet' }], nullable: true }, expected: { type: 'ref', nullable: true } },
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

  it('produces an intersection for multiple allOf members', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        allOf: [{ $ref: '#/components/schemas/Pet' }, { type: 'object', properties: { tag: { type: 'string' } } }],
      },
    })

    expect(node.type).toBe('intersection')
    expect(ast.narrowSchema(node, 'intersection')?.members?.map((member) => member.type)).toStrictEqual(['ref', 'object'])
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

  it('merges adjacent anonymous object members within allOf into a single object', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        allOf: [
          { type: 'object', properties: { foo: { type: 'string' } } },
          { type: 'object', properties: { bar: { type: 'string' } } },
        ],
      },
    })

    // Both anonymous allOf members should be merged into one object
    const intersection = ast.narrowSchema(node, 'intersection')
    expect(intersection?.members).toHaveLength(1)
    const merged = ast.narrowSchema(intersection?.members?.[0], 'object')
    expect(merged?.properties?.map((p) => p.name)).toStrictEqual(['foo', 'bar'])
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
  it.each([
    { keyword: 'oneOf', strategy: 'one' },
    { keyword: 'anyOf', strategy: 'any' },
  ] as const)('maps $keyword to a union node with strategy $strategy', ({ keyword, strategy }) => {
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

  it('converts each oneOf member schema', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Pet' }],
      },
    })

    expect(ast.narrowSchema(node, 'union')?.members?.map((member) => member.type)).toStrictEqual(['string', 'ref'])
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

  it('parses oneOf with object members without explicit discriminator', () => {
    // Test case from issue #14: oneOf should be preserved for validation
    const node = parseSchema(emptyCtx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/TypeA' }, { $ref: '#/components/schemas/TypeB' }],
      },
    })

    expect(node).toMatchObject({ type: 'union', strategy: 'one' })
    expect(ast.narrowSchema(node, 'union')?.members?.map((member) => member.type)).toStrictEqual(['ref', 'ref'])
  })

  it.each([
    { title: 'two members', oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }], members: ['ref', 'ref'] },
    { title: 'one member', oneOf: [{ $ref: '#/components/schemas/Cat' }], members: ['ref'] },
  ] satisfies Array<{ title: string; oneOf: Array<SchemaObject>; members: Array<string> }>)(
    'intersects a oneOf with $title with the sibling properties when properties are present',
    ({ oneOf, members }) => {
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

    it('resolves required-only anyOf branches inside allOf against sibling allOf members', () => {
      const node = parseSchema(emptyCtx, {
        schema: {
          type: 'object',
          allOf: [
            {
              properties: {
                shippingAddress: { type: 'string' },
                billingAddress: { type: 'string' },
              },
            },
            {
              anyOf: [{ required: ['shippingAddress'] }, { required: ['billingAddress'] }],
            },
          ],
        },
      })

      expect(node.type).toBe('intersection')
      const intersection = ast.narrowSchema(node, 'intersection')!
      const unionMember = intersection.members?.find((m) => m.type === 'union')
      expect(unionMember).toBeDefined()
      const unionNode = ast.narrowSchema(unionMember!, 'union')
      expect(unionNode?.strategy).toBe('any')
      expect(unionNode?.members).toHaveLength(2)

      const branch1 = ast.narrowSchema(unionNode?.members?.[0], 'object')
      expect(branch1?.properties[0]).toMatchObject({ name: 'shippingAddress', required: true, schema: { type: 'string' } })
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

    it('preserves discriminated parent propagation when child uses allOf with oneOf', () => {
      const doc: Document = {
        openapi: '3.0.0',
        info: { title: 'Test', version: '1.0.0' },
        paths: {},
        components: {
          schemas: {
            ChildItem: {
              type: 'object',
              allOf: [
                {
                  properties: {
                    itemId: { type: 'string' },
                  },
                },
                {
                  oneOf: [{ required: ['itemId'] }],
                },
              ],
            },
          },
        },
      } as Document
      const testCtx = { document: doc, refs: createRefs(doc) }
      const childNode = parseSchema(testCtx, { schema: doc.components!.schemas!.ChildItem! as SchemaObject, name: 'ChildItem' })

      const patched = patchDiscriminatorNode(childNode, { propertyName: 'kind', enumValues: ['child'] })
      expect(patched.type).toBe('intersection')
      const patchedIntersection = ast.narrowSchema(patched, 'intersection')!
      const hasKind = patchedIntersection.members?.some((m) => ast.narrowSchema(m, 'object')?.properties.some((p) => p.name === 'kind'))
      expect(hasKind).toBe(true)
    })
  })
})

describe('parseSchema discriminator on union', () => {
  it('narrows the discriminator property to a single value per union member when a mapping is present', () => {
    const node = parseSchema(emptyCtx, {
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

    expect(ast.narrowSchema(sharedTypeProp?.schema, 'enum')?.enumValues).toStrictEqual(['dog', 'cat'])

    const { members } = unionNode

    // Dog member: intersection of Dog ref + synthetic discriminant object { type: 'dog' }
    const dogIntersection = ast.narrowSchema(members![0], 'intersection')
    const dogDiscNode = ast.narrowSchema(dogIntersection!.members![1], 'object')
    const dogTypeProp = dogDiscNode?.properties?.find((p) => p.name === 'type')
    expect(dogTypeProp?.schema).toMatchObject({ type: 'enum', readOnly: true, enumValues: ['dog'] })

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

  it('embeds the discriminant value into each union member as an intersection when mapping is present', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { $ref: '#/components/schemas/Cat' }],
        discriminator: {
          propertyName: 'type',
          mapping: {
            dog: '#/components/schemas/Dog',
            cat: '#/components/schemas/Cat',
          },
        },
      },
    })

    expect(node.type).toBe('union')
    const { members } = ast.narrowSchema(node, 'union')!

    // Dog member: intersection of Dog ref + { type: 'dog' }
    const dogIntersection = ast.narrowSchema(members![0], 'intersection')
    expect(dogIntersection).toBeDefined()
    const dogDiscNode = ast.narrowSchema(dogIntersection!.members![1], 'object')
    const dogTypeProp = dogDiscNode?.properties?.find((p) => p.name === 'type')
    expect(ast.narrowSchema(dogTypeProp?.schema, 'enum')?.enumValues).toStrictEqual(['dog'])

    // Cat member: intersection of Cat ref + { type: 'cat' }
    const catIntersection = ast.narrowSchema(members![1], 'intersection')
    expect(catIntersection).toBeDefined()
    const catDiscNode = ast.narrowSchema(catIntersection!.members![1], 'object')
    const catTypeProp = catDiscNode?.properties?.find((p) => p.name === 'type')
    expect(ast.narrowSchema(catTypeProp?.schema, 'enum')?.enumValues).toStrictEqual(['cat'])
  })

  it('leaves members without a mapping entry as plain refs', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { type: 'string' }],
        discriminator: {
          propertyName: 'type',
          mapping: {
            dog: '#/components/schemas/Dog',
          },
        },
      },
    })

    // Dog is in the mapping → wrapped in an intersection; the string literal has no mapping entry → left as-is
    expect(ast.narrowSchema(node, 'union')?.members?.map((member) => member.type)).toStrictEqual(['intersection', 'string'])
  })

  it('leaves members as plain refs when the variant cannot be resolved', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        oneOf: [{ $ref: '#/components/schemas/Dog' }, { $ref: '#/components/schemas/Cat' }],
        discriminator: { propertyName: 'type' },
      },
    })

    // Dog and Cat are absent from this document, so the implicit value can't be safely derived.
    expect(ast.narrowSchema(node, 'union')?.members?.map((member) => member.type)).toStrictEqual(['ref', 'ref'])
  })

  it('folds the implicit schema-name value into ref members when no mapping is present', async () => {
    const oas = await parseDocument({
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
    })

    const pet = findSchema(parseOas(oas), 'Pet')
    const { members } = ast.narrowSchema(pet, 'union')!

    const discriminantOf = (member: ast.SchemaNode) => {
      const discNode = ast.narrowSchema(ast.narrowSchema(member, 'intersection')?.members?.[1], 'object')
      return ast.narrowSchema(discNode?.properties?.find((p) => p.name === 'petType')?.schema, 'enum')?.enumValues
    }

    expect(members?.map((member) => member.type)).toStrictEqual(['intersection', 'intersection'])
    expect(discriminantOf(members![0]!)).toStrictEqual(['Cat'])
    expect(discriminantOf(members![1]!)).toStrictEqual(['Dog'])
  })

  it('leaves a ref member untouched when the variant already pins the discriminator to a literal', async () => {
    const oas = await parseDocument({
      openapi: '3.0.3',
      info: { title: 'SelfDescribingDiscriminator', version: '1.0.0' },
      paths: {},
      components: {
        schemas: {
          Notification: {
            oneOf: [{ $ref: '#/components/schemas/Approved' }, { $ref: '#/components/schemas/Disapproved' }],
            discriminator: { propertyName: 'kind' },
          },
          Approved: { type: 'object', properties: { kind: { type: 'string', enum: ['APPROVED'] } } },
          Disapproved: { type: 'object', properties: { kind: { type: 'string', enum: ['DISAPPROVED'] } } },
        },
      },
    })

    const notification = findSchema(parseOas(oas), 'Notification')

    // Each variant already carries its own `kind` literal, so folding the schema name would
    // collide with it; the members must stay plain refs.
    expect(ast.narrowSchema(notification, 'union')?.members?.map((member) => member.type)).toStrictEqual(['ref', 'ref'])
  })
})

describe('parseSchema const (OAS 3.1)', () => {
  it.each([{ value: 'active' }, { value: 42 }, { value: true }])('maps const $value to a single-value enum', ({ value }) => {
    const node = parseSchema(emptyCtx, { schema: { const: value } })

    expect(node).toMatchObject({ type: 'enum', enumValues: [value] })
  })

  it('propagates name on const enum', () => {
    const node = parseSchema(emptyCtx, {
      schema: { const: 'active' },
      name: 'Status',
    })

    expect(node.name).toBe('Status')
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

  it('keeps a null-only type array as a null node', () => {
    expect(parseSchema(emptyCtx, { schema: { type: ['null'] } }).type).toBe('null')
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
  it('maps additionalProperties: true to true', () => {
    const node = parseSchema(emptyCtx, { schema: { type: 'object', additionalProperties: true } })

    expect(node.type).toBe('object')
    expect(ast.narrowSchema(node, 'object')?.additionalProperties).toBe(true)
  })

  it.each([
    { title: 'a string schema', additionalProperties: { type: 'string' }, expected: { type: 'string' } },
    { title: 'an integer schema', additionalProperties: { type: 'integer' }, expected: { type: 'integer' } },
    { title: 'an empty schema (uses unknownType)', additionalProperties: {}, expected: { type: 'unknown' } },
  ] satisfies Array<{ title: string; additionalProperties: SchemaObject; expected: Record<string, unknown> }>)(
    'maps additionalProperties with $title to a SchemaNode',
    ({ additionalProperties, expected }) => {
      const node = parseSchema(emptyCtx, { schema: { type: 'object', additionalProperties } })

      expect(node.type).toBe('object')
      expect(ast.narrowSchema(node, 'object')?.additionalProperties).toMatchObject(expected)
    },
  )

  it('leaves additionalProperties unset for additionalProperties: false', () => {
    const node = parseSchema(emptyCtx, { schema: { type: 'object', additionalProperties: false } })

    expect(ast.narrowSchema(node, 'object')?.additionalProperties).toBeFalsy()
  })

  it.each([
    { unknownType: 'any', type: 'any' },
    { unknownType: 'unknown', type: 'unknown' },
  ] satisfies Array<{ unknownType: ast.ParserOptions['unknownType']; type: string }>)(
    'respects unknownType: $unknownType for empty additionalProperties',
    ({ unknownType, type }) => {
      const node = parseSchema(emptyCtx, { schema: { type: 'object', additionalProperties: {} } }, { unknownType })

      expect(ast.narrowSchema(node, 'object')?.additionalProperties).toMatchObject({ type })
    },
  )

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
  it.each([
    { title: 'prefixItems alone', schema: { prefixItems: [{ type: 'string' }] } },
    { title: 'prefixItems next to type: array', schema: { type: 'array', prefixItems: [{ type: 'string' }] } },
  ] satisfies Array<{ title: string; schema: SchemaObject }>)('maps $title to a tuple node', ({ schema }) => {
    expect(parseSchema(emptyCtx, { schema }).type).toBe('tuple')
  })

  it('maps each prefixItem to an items entry in order', () => {
    const node = parseSchema(emptyCtx, {
      schema: {
        prefixItems: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
      },
    })

    expect(ast.narrowSchema(node, 'tuple')?.items?.map((item) => item.type)).toStrictEqual(['string', 'number', 'boolean'])
  })

  it.each([
    { title: 'a $ref prefixItem to a ref node', prefixItem: { $ref: '#/components/schemas/Pet' }, type: 'ref' },
    { title: 'a nested object prefixItem to an object node', prefixItem: { type: 'object', properties: { id: { type: 'integer' } } }, type: 'object' },
  ] satisfies Array<{ title: string; prefixItem: SchemaObject; type: string }>)('converts $title', ({ prefixItem, type }) => {
    const node = parseSchema(emptyCtx, { schema: { prefixItems: [prefixItem] } })

    expect(ast.narrowSchema(node, 'tuple')?.items?.[0]?.type).toBe(type)
  })

  it.each([
    { title: 'items to rest', items: { type: 'number' }, rest: 'number' },
    { title: 'a $ref items to a ref rest', items: { $ref: '#/components/schemas/Extra' }, rest: 'ref' },
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

  it('produces an empty items array for an empty prefixItems', () => {
    const node = parseSchema(emptyCtx, { schema: { prefixItems: [] } })

    expect(ast.narrowSchema(node, 'tuple')?.items).toStrictEqual([])
  })

  it.each([
    { title: 'third', prefixItems: [{ type: 'integer' }, { type: 'string' }, { enum: ['NW', 'NE', 'SW', 'SE'] }], index: 2 },
    { title: 'second', prefixItems: [{ type: 'integer' }, { enum: ['NW', 'NE', 'SW', 'SE'] }], index: 1 },
  ] satisfies Array<{ title: string; prefixItems: Array<SchemaObject>; index: number }>)(
    'names the $title enum element inside a tuple property using parent + propName',
    ({ prefixItems, index }) => {
      const node = parseSchema(
        emptyCtx,
        {
          schema: {
            type: 'object',
            properties: {
              identifier: { type: 'array', prefixItems },
            },
          },
          name: 'Address',
        },
        { enumSuffix: 'enum' },
      )

      const identifierProp = ast.narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'identifier')
      const tupleNode = ast.narrowSchema(identifierProp?.schema, 'tuple')
      expect(tupleNode?.items?.[index]).toMatchObject({ type: 'enum', name: 'AddressIdentifierEnum' })
    },
  )

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

  it.each([
    { title: 'a single value', schema: { type: 'integer', enum: [42] }, values: [42], names: ['42'] },
    { title: 'duplicate values', schema: { type: 'integer', enum: [1, 1, 2] }, values: [1, 2], names: ['1', '2'] },
    { title: 'duplicate values without an extension key', schema: { type: 'integer', enum: [5, 5, 10] }, values: [5, 10], names: ['5', '10'] },
  ] satisfies Array<{ title: string; schema: SchemaObject; values: Array<number>; names: Array<string> }>)(
    'deduplicates numeric enum values and uses the stringified value as name for $title',
    ({ schema, values, names }) => {
      const namedEnumValues = ast.narrowSchema(parseSchema(emptyCtx, { schema }), 'enum')?.namedEnumValues

      expect(namedEnumValues?.map((v) => v.value)).toStrictEqual(values)
      expect(namedEnumValues?.map((v) => v.name)).toStrictEqual(names)
    },
  )

  it.each([
    { title: 'null in the enum values', schema: { enum: ['a', null, 'b'] }, enumValues: ['a', 'b'] },
    { title: 'a trailing null in the enum values', schema: { enum: ['a', 'b', null] }, enumValues: ['a', 'b'] },
    { title: 'null in the enum values combined with nullable', schema: { enum: ['a', null], nullable: true }, enumValues: ['a'] },
    // drf-spectacular splits blank/null choices into `BlankEnum` ({ enum: [''] }) and
    // `NullEnum` ({ enum: [null] }) components, combined with the real enum via `oneOf`.
    { title: 'blank and null together', schema: { enum: ['', null] }, enumValues: [''] },
  ] satisfies Array<{ title: string; schema: SchemaObject; enumValues: Array<unknown> }>)(
    'strips null from enumValues and sets nullable for $title',
    ({ schema, enumValues }) => {
      const node = parseSchema(emptyCtx, { schema })

      expect(node.nullable).toBe(true)
      expect(ast.narrowSchema(node, 'enum')?.enumValues).toStrictEqual(enumValues)
    },
  )

  it('keeps a blank-only enum (BlankEnum) as a single "" member', () => {
    const node = parseSchema(emptyCtx, { schema: { enum: [''] } })

    expect(ast.narrowSchema(node, 'enum')?.enumValues).toStrictEqual([''])
  })

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
    ({ schema, primitive, values }) => {
      const node = parseSchema(emptyCtx, { schema })
      const namedEnumValues = ast.narrowSchema(node, 'enum')?.namedEnumValues

      expect(node.type).toBe('enum')
      expect(node.primitive).toBe(primitive)
      expect(namedEnumValues?.map((v) => v.value)).toStrictEqual(values)
      expect(namedEnumValues?.every((v) => v.primitive === primitive)).toBe(true)
    },
  )

  it.each(['x-enumNames', 'x-enum-varnames'] as const)('uses %s labels as namedEnumValues names', (key) => {
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

  it.each(['x-enumDescriptions', 'x-enum-descriptions'] as const)('uses %s as namedEnumValues descriptions', (key) => {
    const node = parseSchema(emptyCtx, {
      schema: {
        enum: ['active', 'inactive'],
        'x-enum-varnames': ['Active', 'Inactive'],
        [key]: ['Currently active', 'No longer active'],
      },
    })
    const values = ast.narrowSchema(node, 'enum')?.namedEnumValues

    expect(values?.map((v) => v.name)).toStrictEqual(['Active', 'Inactive'])
    expect(values?.map((v) => v.description)).toStrictEqual(['Currently active', 'No longer active'])
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
      title: 'three non-null types',
      schema: { type: ['string', 'integer', 'boolean'] },
      expected: { type: 'union' },
      members: ['string', 'integer', 'boolean'],
    },
    {
      title: 'null among multiple types',
      schema: { type: ['string', 'integer', 'null'] },
      expected: { type: 'union', nullable: true },
      members: ['string', 'integer'],
    },
    {
      title: 'null leading multiple types',
      schema: { type: ['null', 'string', 'integer'] },
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
    { title: 'null leading a single non-null type', schema: { type: ['null', 'string'] }, expected: { type: 'string', nullable: true } },
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
  it('converts items to a single-element items array', () => {
    const node = parseSchema(emptyCtx, {
      schema: { type: 'array', items: { type: 'string' } },
    })

    expect(ast.narrowSchema(node, 'array')?.items?.map((item) => item.type)).toStrictEqual(['string'])
  })

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

  it('converts ref items', () => {
    const node = parseSchema(emptyCtx, {
      schema: { type: 'array', items: { $ref: '#/components/schemas/Pet' } },
    })

    expect(node).toMatchObject({ type: 'array', items: [{ type: 'ref' }] })
  })

  it('qualifies inline enums on object array items with the array parent name', () => {
    const node = parseSchema(emptyCtx, {
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
      name: 'AccountLoginsResponse',
    })
    const obj = ast.narrowSchema(node, 'object')
    const data = obj?.properties?.[0]?.schema
    const items = ast.narrowSchema(data, 'array')?.items?.[0]
    const status = ast.narrowSchema(items, 'object')?.properties?.[0]?.schema

    expect(status?.name).toBe('AccountLoginsResponseDataStatusEnum')
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
    const oas = await parseDocument({
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
    })
    const root = parseOas(oas)

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
    it.each([
      { title: 'unknown by default', options: undefined, type: 'unknown' },
      { title: 'any for emptySchemaType: any', options: { emptySchemaType: 'any' }, type: 'any' },
      { title: 'void for emptySchemaType: void', options: { emptySchemaType: 'void' }, type: 'void' },
      { title: 'unknown for emptySchemaType: unknown', options: { emptySchemaType: 'unknown' }, type: 'unknown' },
    ] satisfies Array<{ title: string; options: Partial<ast.ParserOptions> | undefined; type: string }>)(
      'returns $title for an empty schema',
      ({ options, type }) => {
        expect(parseSchema(emptyCtx, { schema: {} }, options).type).toBe(type)
      },
    )

    it('emptySchemaType does not affect typed schemas', () => {
      const node = parseSchema(emptyCtx, { schema: { type: 'string' } }, { emptySchemaType: 'any' })

      expect(node.type).toBe('string')
    })

    it.each([
      { title: 'unknown by default', options: undefined, type: 'unknown' },
      { title: 'any for emptySchemaType: any', options: { emptySchemaType: 'any' }, type: 'any' },
    ] satisfies Array<{ title: string; options: Partial<ast.ParserOptions> | undefined; type: string }>)(
      'preserves metadata (title, description, deprecated, nullable, readOnly, writeOnly, default, examples, format) on a typeless schema mapped to $title',
      ({ options, type }) => {
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
          options,
        )

        expect(node).toMatchObject({
          type,
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
      },
    )

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
    it.each([
      { title: 'integer int64 to integer', schema: { type: 'integer', format: 'int64' }, integerType: 'number', type: 'integer' },
      { title: 'integer int64 to bigint', schema: { type: 'integer', format: 'int64' }, integerType: 'bigint', type: 'bigint' },
      { title: 'integer uint64 to integer', schema: { type: 'integer', format: 'uint64' }, integerType: 'number', type: 'integer' },
      { title: 'integer uint64 to bigint', schema: { type: 'integer', format: 'uint64' }, integerType: 'bigint', type: 'bigint' },
      { title: 'integer int32 to integer', schema: { type: 'integer', format: 'int32' }, integerType: 'bigint', type: 'integer' },
      { title: 'number float to number (non-integer types are untouched)', schema: { type: 'number', format: 'float' }, integerType: 'bigint', type: 'number' },
    ] satisfies Array<{ title: string; schema: SchemaObject; integerType: ast.ParserOptions['integerType']; type: string }>)(
      'integerType: $integerType maps $title',
      ({ schema, integerType, type }) => {
        const node = parseSchema(emptyCtx, { schema }, { integerType })

        expect(node.type).toBe(type)
      },
    )
  })

  describe('dateType', () => {
    it.each([
      { title: 'date-time to datetime without offset by default', format: 'date-time', dateType: undefined, expected: { type: 'datetime', offset: false } },
      {
        title: 'date-time to datetime without offset for dateType: string',
        format: 'date-time',
        dateType: 'string',
        expected: { type: 'datetime', offset: false },
      },
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
      { title: 'date to a date string by default', format: 'date', dateType: undefined, expected: { type: 'date', representation: 'string' } },
      { title: 'date to a date string for dateType: string', format: 'date', dateType: 'string', expected: { type: 'date', representation: 'string' } },
      { title: 'date to a Date for dateType: date', format: 'date', dateType: 'date', expected: { type: 'date', representation: 'date' } },
      { title: 'date to a string for dateType: false', format: 'date', dateType: false, expected: { type: 'string' } },
      { title: 'time to a time string by default', format: 'time', dateType: undefined, expected: { type: 'time', representation: 'string' } },
      { title: 'time to a time string for dateType: string', format: 'time', dateType: 'string', expected: { type: 'time', representation: 'string' } },
      { title: 'time to a Date for dateType: date', format: 'time', dateType: 'date', expected: { type: 'time', representation: 'date' } },
      { title: 'time to a string for dateType: false', format: 'time', dateType: false, expected: { type: 'string' } },
      // Object form: each format resolves independently, an omitted key defaults to string.
      {
        title: 'date-time to a Date for dateType: { dateTime: date }',
        format: 'date-time',
        dateType: { dateTime: 'date' },
        expected: { type: 'date', representation: 'date' },
      },
      {
        title: 'date to a date string for dateType: { dateTime: date }',
        format: 'date',
        dateType: { dateTime: 'date' },
        expected: { type: 'date', representation: 'string' },
      },
      {
        title: 'time to a time string for dateType: { dateTime: date }',
        format: 'time',
        dateType: { dateTime: 'date' },
        expected: { type: 'time', representation: 'string' },
      },
      {
        title: 'date to a string for dateType: { date: false, dateTime: date }',
        format: 'date',
        dateType: { date: false, dateTime: 'date' },
        expected: { type: 'string' },
      },
      { title: 'date to a string for dateType: { date: false }', format: 'date', dateType: { date: false }, expected: { type: 'string' } },
      {
        title: 'date-time to datetime without offset for dateType: { date: false }',
        format: 'date-time',
        dateType: { date: false },
        expected: { type: 'datetime', offset: false },
      },
    ] satisfies Array<{ title: string; format: string; dateType: ast.ParserOptions['dateType'] | undefined; expected: Record<string, unknown> }>)(
      'maps $title',
      ({ format, dateType, expected }) => {
        const node = parseSchema(emptyCtx, { schema: { type: 'string', format } }, dateType === undefined ? undefined : { dateType })

        expect(node).toMatchObject(expected)
      },
    )
  })
})

describe('parseSchema not keyword', () => {
  // JSON Schema `not` has no direct equivalent in most code generators.
  // The parser intentionally does not handle it and falls through to the configured emptySchemaType.
  // Cast required: `not` is valid JSON Schema / OAS 3.1 but not in the TS SchemaObject type.
  it.each([
    { title: 'unknown by default', options: undefined, type: 'unknown' },
    { title: 'unknown for emptySchemaType: unknown', options: { emptySchemaType: 'unknown' }, type: 'unknown' },
    { title: 'any for emptySchemaType: any', options: { emptySchemaType: 'any' }, type: 'any' },
  ] satisfies Array<{ title: string; options: Partial<ast.ParserOptions> | undefined; type: string }>)(
    'falls through to $title since "not" is not supported',
    ({ options, type }) => {
      const node = parseSchema(emptyCtx, { schema: { not: { type: 'string' } } as SchemaObject }, options)

      expect(node.type).toBe(type)
    },
  )
})

describe('parseSchema circular allOf discriminator detection', () => {
  it('skips allOf member that references the child schema back through its discriminator parent', async () => {
    // This models the OAS pattern: Animal (parent, discriminator) → Cat (child, allOf: [Animal])
    // The parser must skip the back-reference to Animal from Cat's allOf to avoid circular types.
    const oas = await parseDocument({
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
    })

    const cat = findSchema(parseOas(oas), 'Cat')

    expect(cat?.type).toBe('intersection')
    // The intersection should contain only the concrete Cat properties — Animal is filtered out.
    const members = ast.narrowSchema(cat, 'intersection')?.members ?? []
    expect(members.length).toBeGreaterThan(0)
    expect(members.some((m) => m.type === 'ref' && m.name === 'Animal')).toBe(false)
  })

  it('injects the narrowed discriminant value when the discriminator parent is filtered from allOf', async () => {
    // Cat is identified as 'cat' in Animal's mapping; the Animal $ref is skipped to prevent
    // circularity, but { type: 'cat' } must be injected into Cat's intersection.
    const oas = await parseDocument({
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
    })

    const root = parseOas(oas)

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
  const oas = await parseDocument({
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
  })

  const getItems = findOperation(parseOas(oas), 'getItems')

  it('parses operation description', () => {
    expect(getItems?.description).toBe('Fetch a list of items')
  })

  it.each([
    { name: 'X-Request-ID', in: 'header', required: true, type: 'uuid' },
    { name: 'session', in: 'cookie', required: false, type: 'string' },
  ])('converts $in parameters with in: $in', ({ name, in: location, required, type }) => {
    expect(getItems?.parameters.find((p) => p.name === name)).toMatchObject({ in: location, required, schema: { type } })
  })

  it('keeps header, cookie and query parameters in the same operation', () => {
    expect(getItems?.parameters.map((p) => p.in)).toStrictEqual(['header', 'cookie', 'query'])
  })
})

describe('buildAst – parameter description propagation', async () => {
  const oas = await parseDocument({
    openapi: '3.0.3',
    info: { title: 'Params', version: '1.0.0' },
    paths: {
      '/pets': {
        get: {
          operationId: 'listPets',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              description: 'Maximum number of results to return',
              required: false,
              schema: { type: 'integer' },
            },
            {
              name: 'petId',
              in: 'path',
              description: 'The id of the pet to retrieve',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': { description: 'OK' },
          },
        },
      },
    },
  })

  const listPets = findOperation(parseOas(oas), 'listPets')

  it.each([
    { name: 'limit', in: 'query', description: 'Maximum number of results to return' },
    { name: 'petId', in: 'path', description: 'The id of the pet to retrieve' },
  ])('propagates parameter-level description to schema.description for $in params', ({ name, description }) => {
    expect(listPets?.parameters.find((p) => p.name === name)?.schema.description).toBe(description)
  })

  it('prefers parameter-level description over schema-level description', async () => {
    const oasWithBoth = await parseDocument({
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
    })
    const q = findOperation(parseOas(oasWithBoth), 'getItems')?.parameters.find((p) => p.name === 'q')

    expect(q?.schema.description).toBe('Parameter description')
  })
})

describe('parameter enum naming', () => {
  it('parameter enum schemas are qualified with `<operationName><ParamName>` so nested enums collide-free across operations', async () => {
    const oas = await parseDocument({
      openapi: '3.0.3',
      info: { title: 'Test', version: '1.0.0' },
      paths: {
        '/pets': {
          get: {
            operationId: 'listPets',
            parameters: [
              {
                name: 'status',
                in: 'query',
                required: false,
                schema: {
                  type: 'string',
                  default: 'available',
                  enum: ['available', 'pending', 'sold'],
                },
              },
            ],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    })
    const statusParam = findOperation(parseOas(oas), 'listPets')?.parameters.find((p) => p.name === 'status')

    expect(statusParam?.schema).toMatchObject({ type: 'enum', name: 'ListPetsStatus', enumValues: ['available', 'pending', 'sold'], default: 'available' })
  })
})

describe('enum naming', () => {
  it('enum name accumulates full parent path without collision suffix', () => {
    const orderNode = parseSchema(
      emptyCtx,
      {
        schema: {
          type: 'object',
          properties: {
            params: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['active', 'inactive'] },
              },
            },
          },
        },
        name: 'Order',
      },
      { enumSuffix: 'enum' },
    )
    const customerNode = parseSchema(
      emptyCtx,
      {
        schema: {
          type: 'object',
          properties: {
            params: {
              type: 'object',
              properties: {
                status: { type: 'string', enum: ['new', 'returning'] },
              },
            },
          },
        },
        name: 'Customer',
      },
      { enumSuffix: 'enum' },
    )

    const statusEnumOf = (node: ast.SchemaNode) =>
      ast.narrowSchema(
        ast
          .narrowSchema(ast.narrowSchema(node, 'object')?.properties?.find((p) => p.name === 'params')?.schema, 'object')
          ?.properties?.find((p) => p.name === 'status')?.schema,
        'enum',
      )

    // Full path means no collision
    expect(statusEnumOf(orderNode)?.name).toBe('OrderParamsStatusEnum')
    expect(statusEnumOf(customerNode)?.name).toBe('CustomerParamsStatusEnum')
  })

  it('oneOf shared property enums include schema name', () => {
    const node = parseSchema(
      emptyCtx,
      {
        schema: {
          properties: {
            status: { type: 'string', enum: ['active', 'inactive'] },
          },
          oneOf: [
            { type: 'object', properties: { role: { type: 'string' } } },
            { type: 'object', properties: { dept: { type: 'string' } } },
          ],
        },
        name: 'Pet',
      },
      { enumSuffix: 'enum' },
    )

    const topIntersection = ast.narrowSchema(node, 'intersection')
    const sharedObj = topIntersection?.members?.find((m) => ast.narrowSchema(m, 'object')?.properties?.some((p) => p.name === 'status'))
    const statusProp = ast.narrowSchema(sharedObj, 'object')?.properties?.find((p) => p.name === 'status')

    // Non-legacy: name includes schema name
    expect(ast.narrowSchema(statusProp?.schema, 'enum')?.name).toBe('PetStatusEnum')
  })

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

  it('merges parameters from a $ref path-item into the operation', () => {
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

    const op = findOperation(parseOas(document), 'listThings')

    expect(op?.parameters).toMatchObject([{ name: 'limit', in: 'query' }])
  })

  it('falls back to the $ref path-item summary and description', () => {
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

    const op = findOperation(parseOas(document), 'listThingsWithDoc')

    expect(op).toMatchObject({ summary: 'Shared summary', description: 'Shared description' })
  })

  // Regression test for the global `contentType` option: getRequestBodyMeta used to read
  // operation.schema.requestBody directly, relying on getRequestBodyContentTypes having mutated
  // it first. That mutation was skipped whenever a global `contentType` was set, so a $ref'd
  // requestBody's description/required were silently dropped. refs.deref() resolves
  // independently of that skip.
  it.each([
    { title: 'without a contentType option', contentType: undefined },
    { title: 'with a global contentType option', contentType: 'application/json' },
  ] satisfies Array<{ title: string; contentType: ContentType | undefined }>)(
    'resolves description, required and content from a $ref requestBody $title',
    ({ contentType }) => {
      const op = findOperation(parseOas(refRequestBodyDocument, { contentType }), 'createThing')

      expect(op?.requestBody).toMatchObject({
        description: 'Create a thing',
        required: true,
        content: [{ contentType: 'application/json' }],
      })
    },
  )
})
