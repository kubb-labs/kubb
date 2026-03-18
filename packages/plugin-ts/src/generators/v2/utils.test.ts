import { createOperation, createParameter, createResponse, createSchema } from '@kubb/ast'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { printerTs } from '../../printer.ts'
import { buildDataSchemaNode, buildParamsSchema, buildResponsesSchemaNode, buildResponseUnionSchemaNode } from './utils.ts'

const resolveName = ({ name, type }: { name: string; type: 'type' | 'function' }) => {
  const words = name.split(/\s+/)
  if (type === 'function') {
    return words.map((w, i) => (i === 0 ? w[0]!.toLowerCase() + w.slice(1) : w[0]!.toUpperCase() + w.slice(1))).join('')
  }
  return words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join('')
}

const printer = printerTs({ optionalType: 'questionToken', arrayType: 'array', enumType: 'inlineLiteral' })
const tsPrinter = ts.createPrinter()
const sourceFile = ts.createSourceFile('', '', ts.ScriptTarget.Latest)

function printSchema(schema: ReturnType<typeof buildParamsSchema>): string {
  const node = printer.print(schema)

  if (!node) return ''

  return tsPrinter.printNode(ts.EmitHint.Unspecified, node, sourceFile)
}

describe('buildParamsSchema', () => {
  it('builds an object type for required params', () => {
    const params = [createParameter({ name: 'petId', schema: createSchema({ type: 'string' }), in: 'path', required: true })]

    expect(printSchema(buildParamsSchema({ params, operationId: 'showPetById', resolveName }))).toMatchInlineSnapshot(`
      "{
          petId: showPetByIdPathPetId;
      }"
    `)
  })

  it('marks optional params with ?', () => {
    const params = [createParameter({ name: 'limit', schema: createSchema({ type: 'integer' }), in: 'query', required: false })]

    expect(printSchema(buildParamsSchema({ params, operationId: 'listPets', resolveName }))).toMatchInlineSnapshot(`
      "{
          limit?: listPetsQueryLimit;
      }"
    `)
  })

  it('builds an object type for multiple params', () => {
    const params = [
      createParameter({ name: 'storeId', schema: createSchema({ type: 'string' }), in: 'path', required: true }),
      createParameter({ name: 'orderId', schema: createSchema({ type: 'integer' }), in: 'path', required: true }),
    ]

    expect(printSchema(buildParamsSchema({ params, operationId: 'getOrder', resolveName }))).toMatchInlineSnapshot(`
      "{
          storeId: getOrderPathStoreId;
          orderId: getOrderPathOrderId;
      }"
    `)
  })
})

describe('buildDataSchemaNode', () => {
  const baseNode = createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

  it('emits data?: never when no request body', () => {
    const node = createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(printSchema(buildDataSchemaNode({ node, resolveName }))).toMatchInlineSnapshot(`
      "{
          data?: never;
          pathParams?: never;
          queryParams?: never;
          headerParams?: never;
          url: "/pets";
      }"
    `)
  })

  it('emits data? referencing the MutationRequest type when body exists', () => {
    const node = createOperation({ operationId: 'createPet', method: 'POST', path: '/pets', requestBody: createSchema({ type: 'object' }) })

    expect(printSchema(buildDataSchemaNode({ node, resolveName }))).toMatchInlineSnapshot(`
      "{
          data?: createPetData;
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

    expect(printSchema(buildDataSchemaNode({ node, resolveName }))).toMatchInlineSnapshot(`
      "{
          data?: never;
          pathParams: {
              petId: showPetByIdPathPetId;
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

    expect(printSchema(buildDataSchemaNode({ node, resolveName }))).toMatchInlineSnapshot(`
      "{
          data?: never;
          pathParams?: never;
          queryParams?: {
              limit?: listPetsQueryLimit;
          };
          headerParams?: never;
          url: "/pets";
      }"
    `)
  })
})

describe('buildResponsesSchemaNode', () => {
  it('returns null when no responses have schemas', () => {
    const node = createOperation({
      operationId: 'deletePet',
      method: 'DELETE',
      path: '/pets/:petId',
      responses: [createResponse({ statusCode: '204', description: 'No content' })],
    })

    expect(buildResponsesSchemaNode({ node, resolveName })).toBeNull()
  })

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

    expect(printSchema(buildResponsesSchemaNode({ node, resolveName })!)).toMatchInlineSnapshot(`
      "{
          "200": listPetsStatus200;
          default: listPetsStatusDefault;
      }"
    `)
  })
})

describe('buildResponseUnionSchemaNode', () => {
  it('returns null when no responses have schemas', () => {
    const node = createOperation({
      operationId: 'deletePet',
      method: 'DELETE',
      path: '/pets/:petId',
      responses: [createResponse({ statusCode: '204', description: 'No content' })],
    })

    expect(buildResponseUnionSchemaNode({ node, resolveName })).toBeNull()
  })

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

    expect(printSchema(buildResponseUnionSchemaNode({ node, resolveName })!)).toMatchInlineSnapshot(`"(listPetsStatus200 | listPetsStatus405)"`)
  })
})
