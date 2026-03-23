import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { printerTs } from '../printer.ts'
import { resolverTs } from '../resolvers/index.ts'
import { buildDataSchemaNode, buildParamsSchema, buildResponsesSchemaNode, buildResponseUnionSchemaNode } from './utils.ts'

const printer = printerTs({ resolver: resolverTs, optionalType: 'questionToken', arrayType: 'array', enumType: 'inlineLiteral' })
const tsPrinter = ts.createPrinter()
const sourceFile = ts.createSourceFile('', '', ts.ScriptTarget.Latest)

function printSchema(schema: ReturnType<typeof buildParamsSchema>): string {
  const node = printer.print(schema)

  if (!node) return ''

  return tsPrinter.printNode(ts.EmitHint.Unspecified, node, sourceFile)
}

describe('buildParamsSchema', () => {
  it('builds required params as non-optional properties', () => {
    const params = [createParameter({ name: 'petId', schema: createSchema({ type: 'string' }), in: 'path', required: true })]
    const node = createOperation({ operationId: 'showPetById', method: 'GET', path: '/pets/:petId' })

    expect(printSchema(buildParamsSchema({ params, node, resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          petId: ShowPetByIdPathPetId;
      }"
    `)
  })

  it('marks optional params with ?', () => {
    const params = [createParameter({ name: 'limit', schema: createSchema({ type: 'integer' }), in: 'query', required: false })]
    const node = createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(printSchema(buildParamsSchema({ params, node, resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          limit?: ListPetsQueryLimit;
      }"
    `)
  })
})

describe('buildDataSchemaNode', () => {
  const baseNode = createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

  it('emits data?: never when no request body', () => {
    const node = createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(printSchema(buildDataSchemaNode({ node, resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          data?: never;
          pathParams?: never;
          queryParams?: never;
          headerParams?: never;
          url: "/pets";
      }"
    `)
  })

  it('emits data? referencing the Data type when body exists', () => {
    const node = createOperation({ operationId: 'createPet', method: 'POST', path: '/pets', requestBody: { schema: createSchema({ type: 'object' }) } })

    expect(printSchema(buildDataSchemaNode({ node, resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          data?: CreatePetData;
          pathParams?: never;
          queryParams?: never;
          headerParams?: never;
          url: "/pets";
      }"
    `)
  })

  it('emits required pathParams when path parameters exist', () => {
    const node = createOperation({
      operationId: 'showPetById',
      method: 'GET',
      path: '/pets/:petId',
      parameters: [createParameter({ name: 'petId', schema: createSchema({ type: 'string' }), in: 'path', required: true })],
    })

    expect(printSchema(buildDataSchemaNode({ node, resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          data?: never;
          pathParams: {
              petId: ShowPetByIdPathPetId;
          };
          queryParams?: never;
          headerParams?: never;
          url: \`/pets/\${string}\`;
      }"
    `)
  })

  it('emits optional queryParams when query parameters exist', () => {
    const node = createOperation({
      ...baseNode,
      operationId: 'listPets',
      parameters: [createParameter({ name: 'limit', schema: createSchema({ type: 'integer' }), in: 'query', required: false })],
    })

    expect(printSchema(buildDataSchemaNode({ node, resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          data?: never;
          pathParams?: never;
          queryParams?: {
              limit?: ListPetsQueryLimit;
          };
          headerParams?: never;
          url: "/pets";
      }"
    `)
  })

  it('emits JSDoc on queryParams properties when parameters have descriptions', () => {
    const node = createOperation({
      ...baseNode,
      operationId: 'listPets',
      parameters: [
        createParameter({ name: 'limit', schema: createSchema({ type: 'integer', description: 'Maximum number of results' }), in: 'query', required: false }),
      ],
    })

    expect(printSchema(buildDataSchemaNode({ node, resolver: resolverTs }))).toMatchInlineSnapshot(`
      "{
          data?: never;
          pathParams?: never;
          queryParams?: {
              limit?: ListPetsQueryLimit;
          };
          headerParams?: never;
          url: "/pets";
      }"
    `)
  })
})

describe('buildResponsesSchemaNode', () => {
  it('emits a keyed object type for responses with schemas', () => {
    const node = createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      responses: [
        createResponse({ statusCode: '200', description: 'OK', schema: createSchema({ type: 'object' }) }),
        createResponse({ statusCode: 'default', description: 'Error', schema: createSchema({ type: 'object' }) }),
      ],
    })

    expect(printSchema(buildResponsesSchemaNode({ node, resolver: resolverTs })!)).toMatchInlineSnapshot(`
      "{
          "200": ListPetsStatus200;
          default: ListPetsStatusDefault;
      }"
    `)
  })
})

describe('buildResponseUnionSchemaNode', () => {
  it('emits a union of all response types', () => {
    const node = createOperation({
      operationId: 'listPets',
      method: 'GET',
      path: '/pets',
      responses: [
        createResponse({ statusCode: '200', description: 'OK', schema: createSchema({ type: 'object' }) }),
        createResponse({ statusCode: '405', description: 'Error', schema: createSchema({ type: 'object' }) }),
      ],
    })

    expect(printSchema(buildResponseUnionSchemaNode({ node, resolver: resolverTs })!)).toMatchInlineSnapshot(`"(ListPetsStatus200 | ListPetsStatus405)"`)
  })
})
