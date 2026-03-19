import { createOperation, createParameter, createSchema } from '@kubb/ast'
import { describe, expect, it } from 'vitest'
import { defaultResolveName, naming } from './naming.ts'

describe('defaultResolveName', () => {
  it('applies pascalCase to a plain name', () => {
    expect(defaultResolveName({ name: 'pet list' })).toBe('PetList')
  })

  it('applies pascalCase for type and function types', () => {
    expect(defaultResolveName({ name: 'list pets', type: 'type' })).toBe('ListPets')
    expect(defaultResolveName({ name: 'list pets', type: 'function' })).toBe('ListPets')
  })

  it('applies pascalCase in file mode', () => {
    expect(defaultResolveName({ name: 'list pets', type: 'file' })).toBe('ListPets')
  })
})

describe('naming.getSchemaName', () => {
  it('returns the resolved name for a schema node', () => {
    const node = { name: 'Pet' }

    expect(naming.getSchemaName(node)).toBe('Pet')
    expect(naming.getSchemaName(node, { type: 'type' })).toBe('Pet')
  })

  it('throws when schema node has no name', () => {
    const node = {}

    expect(() => naming.getSchemaName(node)).toThrow('Schema node does not have a name')
  })

  it('accepts a custom resolveName', () => {
    const node = { name: 'Pet' }
    const resolveName = ({ name }: { name: string }) => name.toLowerCase()

    expect(naming.getSchemaName(node, { resolveName })).toBe('pet')
  })
})

describe('naming.getParameterName', () => {
  it('resolves a path parameter name', () => {
    const operation = createOperation({ operationId: 'deletePet', method: 'DELETE', path: '/pets/:petId' })
    const param = createParameter({ name: 'petId', schema: createSchema({ type: 'string' }), in: 'path', required: true })

    expect(naming.getParameterName(operation, param)).toBe('DeletePetPathPetId')
  })

  it('resolves a query parameter name', () => {
    const operation = createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })
    const param = createParameter({ name: 'limit', schema: createSchema({ type: 'integer' }), in: 'query', required: false })

    expect(naming.getParameterName(operation, param)).toBe('ListPetsQueryLimit')
  })

  it('resolves a header parameter name', () => {
    const operation = createOperation({ operationId: 'createPet', method: 'POST', path: '/pets' })
    const param = createParameter({ name: 'x-api-key', schema: createSchema({ type: 'string' }), in: 'header', required: true })

    expect(naming.getParameterName(operation, param)).toBe('CreatePetHeaderXApiKey')
  })

  it('accepts a custom resolveName', () => {
    const operation = createOperation({ operationId: 'deletePet', method: 'DELETE', path: '/pets/:petId' })
    const param = createParameter({ name: 'petId', schema: createSchema({ type: 'string' }), in: 'path', required: true })
    const resolveName = ({ name }: { name: string }) => name.toLowerCase()

    expect(naming.getParameterName(operation, param, { resolveName })).toBe('deletepet path petid')
  })
})

describe('naming.getResponseStatusName', () => {
  it('resolves a numeric status code', () => {
    const operation = createOperation({ operationId: 'deletePet', method: 'DELETE', path: '/pets/:petId' })

    expect(naming.getResponseStatusName(operation, 200)).toBe('DeletePetStatus200')
  })

  it('resolves a string status code', () => {
    const operation = createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(naming.getResponseStatusName(operation, 'default')).toBe('ListPetsStatusDefault')
  })

  it('accepts a custom resolveName', () => {
    const operation = createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })
    const resolveName = ({ name }: { name: string }) => name.replace(/\s/g, '_')

    expect(naming.getResponseStatusName(operation, 200, { resolveName })).toBe('listPets_Status_200')
  })
})

describe('naming.getRequestBodyName', () => {
  it('resolves the request body name', () => {
    const operation = createOperation({ operationId: 'createPet', method: 'POST', path: '/pets' })

    expect(naming.getRequestBodyName(operation)).toBe('CreatePetData')
  })

  it('accepts type override', () => {
    const operation = createOperation({ operationId: 'createPet', method: 'POST', path: '/pets' })

    expect(naming.getRequestBodyName(operation, { type: 'type' })).toBe('CreatePetData')
  })
})

describe('naming.getRequestConfigName', () => {
  it('resolves the request config name', () => {
    const operation = createOperation({ operationId: 'deletePet', method: 'DELETE', path: '/pets/:petId' })

    expect(naming.getRequestConfigName(operation)).toBe('DeletePetRequestConfig')
  })
})

describe('naming.getResponsesName', () => {
  it('resolves the responses map name', () => {
    const operation = createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(naming.getResponsesName(operation)).toBe('ListPetsResponses')
  })
})

describe('naming.getResponseName', () => {
  it('resolves the response union name', () => {
    const operation = createOperation({ operationId: 'listPets', method: 'GET', path: '/pets' })

    expect(naming.getResponseName(operation)).toBe('ListPetsResponse')
  })
})
