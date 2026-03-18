import { createParameter, createResponse, createSchema } from '@kubb/ast'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { printerTs } from '../../printer.ts'
import { buildDataSchemaNode, buildParamsSchema, buildResponseUnionSchemaNode, buildResponsesSchemaNode } from './utils.ts'

const mockResolveName = ({ name, type }: { name: string; pluginName: string; type: 'type' | 'function' }) => {
  const words = name.split(/\s+/)
  if (type === 'function') {
    return words.map((w, i) => (i === 0 ? w[0]!.toLowerCase() + w.slice(1) : w[0]!.toUpperCase() + w.slice(1))).join('')
  }
  return words.map((w) => w[0]!.toUpperCase() + w.slice(1)).join('')
}

const pluginName = '@kubb/plugin-ts'

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

    expect(printSchema(buildParamsSchema({ params, operationId: 'showPetById', resolveName: mockResolveName, pluginName }))).toContain('petId: showPetByIdPetId')
  })

  it('marks optional params with ?', () => {
    const params = [createParameter({ name: 'limit', schema: createSchema({ type: 'integer' }), in: 'query', required: false })]

    expect(printSchema(buildParamsSchema({ params, operationId: 'listPets', resolveName: mockResolveName, pluginName }))).toContain('limit?: listPetsLimit')
  })

  it('builds an object type for multiple params', () => {
    const params = [
      createParameter({ name: 'storeId', schema: createSchema({ type: 'string' }), in: 'path', required: true }),
      createParameter({ name: 'orderId', schema: createSchema({ type: 'integer' }), in: 'path', required: true }),
    ]
    const result = printSchema(buildParamsSchema({ params, operationId: 'getOrder', resolveName: mockResolveName, pluginName }))

    expect(result).toContain('storeId: getOrderStoreId')
    expect(result).toContain('orderId: getOrderOrderId')
  })
})

describe('buildDataSchemaNode', () => {
  it('emits data?: never when no request body', () => {
    const node = { operationId: 'listPets', path: '/pets', parameters: [], responses: [], requestBody: undefined } as any
    const result = printSchema(buildDataSchemaNode({ node, resolveName: mockResolveName, pluginName }))

    expect(result).toContain('data?: never')
    expect(result).toContain('pathParams?: never')
    expect(result).toContain('queryParams?: never')
    expect(result).toContain('headerParams?: never')
    expect(result).toContain('url: "/pets"')
  })

  it('emits data? referencing the MutationRequest type when body exists', () => {
    const node = { operationId: 'createPet', path: '/pets', parameters: [], responses: [], requestBody: createSchema({ type: 'object' }) } as any
    expect(printSchema(buildDataSchemaNode({ node, resolveName: mockResolveName, pluginName }))).toContain('data?: createPetMutationRequest')
  })

  it('emits required pathParams when path parameters exist', () => {
    const node = {
      operationId: 'showPetById',
      path: '/pets/:petId',
      parameters: [createParameter({ name: 'petId', schema: createSchema({ type: 'string' }), in: 'path', required: true })],
      responses: [],
      requestBody: undefined,
    } as any
    const result = printSchema(buildDataSchemaNode({ node, resolveName: mockResolveName, pluginName }))

    expect(result).toContain('pathParams: {')
    expect(result).toContain('petId: showPetByIdPetId')
    expect(result).toContain('url: `/pets/${string}`')
  })

  it('emits optional queryParams when query parameters exist', () => {
    const node = {
      operationId: 'listPets',
      path: '/pets',
      parameters: [createParameter({ name: 'limit', schema: createSchema({ type: 'integer' }), in: 'query', required: false })],
      responses: [],
      requestBody: undefined,
    } as any
    const result = printSchema(buildDataSchemaNode({ node, resolveName: mockResolveName, pluginName }))

    expect(result).toContain('queryParams?: {')
    expect(result).toContain('limit?: listPetsLimit')
  })
})

describe('buildResponsesSchemaNode', () => {
  it('returns null when no responses have schemas', () => {
    const node = { operationId: 'deletePet', responses: [createResponse({ statusCode: '204', description: 'No content' })] } as any
    expect(buildResponsesSchemaNode({ node, resolveName: mockResolveName, pluginName })).toBeNull()
  })

  it('emits a keyed object type for responses with schemas', () => {
    const node = {
      operationId: 'listPets',
      responses: [
        createResponse({ statusCode: '200', description: 'OK', schema: createSchema({ type: 'object' }) }),
        createResponse({ statusCode: 'default', description: 'Error', schema: createSchema({ type: 'object' }) }),
      ],
    } as any
    const schema = buildResponsesSchemaNode({ node, resolveName: mockResolveName, pluginName })!
    const result = printSchema(schema)

    expect(result).toContain('"200": listPets200')
    expect(result).toContain('default: listPetsDefault')
  })
})

describe('buildResponseUnionSchemaNode', () => {
  it('returns null when no responses have schemas', () => {
    const node = { operationId: 'deletePet', responses: [createResponse({ statusCode: '204', description: 'No content' })] } as any
    expect(buildResponseUnionSchemaNode({ node, resolveName: mockResolveName, pluginName })).toBeNull()
  })

  it('emits a union of all response types', () => {
    const node = {
      operationId: 'listPets',
      responses: [
        createResponse({ statusCode: '200', description: 'OK', schema: createSchema({ type: 'object' }) }),
        createResponse({ statusCode: '405', description: 'Error', schema: createSchema({ type: 'object' }) }),
      ],
    } as any
    const schema = buildResponseUnionSchemaNode({ node, resolveName: mockResolveName, pluginName })!
    const result = printSchema(schema)

    expect(result).toContain('listPets200')
    expect(result).toContain('listPets405')
    expect(result).toContain('|')
  })
})

