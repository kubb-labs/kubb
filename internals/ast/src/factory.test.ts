import { describe, expect, it } from 'vitest'
import { createOperation, createParameter, createProperty, createResponse, createRoot, createSchema } from './factory.ts'

describe('createRoot', () => {
  it('creates a RootNode with default empty arrays', () => {
    const node = createRoot()

    expect(node.kind).toBe('Root')
    expect(node.schemas).toEqual([])
    expect(node.operations).toEqual([])
  })

  it('accepts overrides', () => {
    const schema = createSchema({ type: 'string' })
    const node = createRoot({ schemas: [schema] })

    expect(node.schemas).toHaveLength(1)
    expect(node.operations).toEqual([])
  })

  it('always sets kind to Root', () => {
    // @ts-expect-error — kind should be overridden back to 'Root'
    const node = createRoot({ kind: 'Operation' })

    expect(node.kind).toBe('Root')
  })
})

describe('createOperation', () => {
  it('creates an OperationNode with required fields', () => {
    const node = createOperation({ operationId: 'getPets', method: 'GET', path: '/pets' })

    expect(node.kind).toBe('Operation')
    expect(node.operationId).toBe('getPets')
    expect(node.method).toBe('GET')
    expect(node.path).toBe('/pets')
    expect(node.tags).toEqual([])
    expect(node.parameters).toEqual([])
    expect(node.responses).toEqual([])
  })

  it('accepts optional fields', () => {
    const node = createOperation({
      operationId: 'createPet',
      method: 'POST',
      path: '/pets',
      summary: 'Create a pet',
      deprecated: true,
      tags: ['pets'],
    })

    expect(node.summary).toBe('Create a pet')
    expect(node.deprecated).toBe(true)
    expect(node.tags).toEqual(['pets'])
  })
})

describe('createSchema', () => {
  it('creates a SchemaNode with a type', () => {
    const node = createSchema({ type: 'string' })

    expect(node.kind).toBe('Schema')
    expect(node.type).toBe('string')
  })

  it('accepts nullable and description', () => {
    const node = createSchema({ type: 'number', nullable: true, description: 'An age value' })

    expect(node.nullable).toBe(true)
    expect(node.description).toBe('An age value')
  })

  it('creates an object schema with properties', () => {
    const prop = createProperty({ name: 'id', schema: createSchema({ type: 'integer' }) })
    const node = createSchema({ type: 'object', properties: [prop] })

    expect(node.properties).toHaveLength(1)
    expect(node.properties?.[0]?.name).toBe('id')
  })

  it('creates a ref schema', () => {
    const node = createSchema({ type: 'ref', name: 'Pet' })

    expect(node.name).toBe('Pet')
  })
})

describe('createProperty', () => {
  it('defaults required to false', () => {
    const node = createProperty({ name: 'name', schema: createSchema({ type: 'string' }) })

    expect(node.kind).toBe('Property')
    expect(node.required).toBe(false)
  })

  it('accepts required: true', () => {
    const node = createProperty({
      name: 'id',
      schema: createSchema({ type: 'integer' }),
      required: true,
    })

    expect(node.required).toBe(true)
  })
})

describe('createParameter', () => {
  it('creates a path parameter', () => {
    const node = createParameter({
      name: 'petId',
      in: 'path',
      schema: createSchema({ type: 'integer' }),
      required: true,
    })

    expect(node.kind).toBe('Parameter')
    expect(node.in).toBe('path')
    expect(node.required).toBe(true)
  })

  it('defaults required to false', () => {
    const node = createParameter({
      name: 'limit',
      in: 'query',
      schema: createSchema({ type: 'integer' }),
    })

    expect(node.required).toBe(false)
  })
})

describe('createResponse', () => {
  it('creates a response with just a status code', () => {
    const node = createResponse({ statusCode: '200' })

    expect(node.kind).toBe('Response')
    expect(node.statusCode).toBe('200')
    expect(node.schema).toBeUndefined()
  })

  it('accepts a schema and description', () => {
    const node = createResponse({
      statusCode: '200',
      schema: createSchema({ type: 'object' }),
      description: 'Success',
    })

    expect(node.schema?.type).toBe('object')
    expect(node.description).toBe('Success')
  })
})
