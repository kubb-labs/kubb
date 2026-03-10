import { describe, expect, it } from 'vitest'
import { createOperation, createParameter, createProperty, createResponse, createRoot, createSchema } from './factory.ts'
import type { RootNode } from './nodes/root.ts'
import { buildRefMap, refMapToObject, resolveRef } from './refs.ts'

/**
 * Minimal petstore-like fixture:
 *
 * Schemas: Pet, NewPet, PetList, Error, PetOrError, FullPet
 * Operations: listPets, createPet, getPetById
 */
function buildFixture(): RootNode {
  const refPet = createSchema({ type: 'ref', ref: 'Pet' })
  const refError = createSchema({ type: 'ref', ref: 'Error' })

  return createRoot({
    schemas: [
      createSchema({
        name: 'Pet',
        type: 'object',
        properties: [
          createProperty({ name: 'id', schema: createSchema({ type: 'integer' }), required: true }),
          createProperty({ name: 'name', schema: createSchema({ type: 'string' }), required: true }),
        ],
      }),
      createSchema({
        name: 'NewPet',
        type: 'object',
        properties: [createProperty({ name: 'name', schema: createSchema({ type: 'string' }), required: true })],
      }),
      createSchema({
        name: 'PetList',
        type: 'array',
        items: [refPet],
      }),
      createSchema({
        name: 'Error',
        type: 'object',
        properties: [
          createProperty({ name: 'code', schema: createSchema({ type: 'integer' }), required: true }),
          createProperty({ name: 'message', schema: createSchema({ type: 'string' }), required: true }),
        ],
      }),
      createSchema({ name: 'PetOrError', type: 'union', members: [refPet, refError] }),
      createSchema({
        name: 'FullPet',
        type: 'intersection',
        members: [
          refPet,
          createSchema({
            type: 'object',
            properties: [createProperty({ name: 'createdAt', schema: createSchema({ type: 'datetime' }) })],
          }),
        ],
      }),
    ],
    operations: [
      createOperation({
        operationId: 'listPets',
        method: 'GET',
        path: '/pets',
        tags: ['pets'],
        parameters: [createParameter({ name: 'limit', in: 'query', schema: createSchema({ type: 'integer' }) })],
        responses: [
          createResponse({ statusCode: '200', schema: createSchema({ type: 'ref', ref: 'PetList' }), mediaType: 'application/json' }),
          createResponse({ statusCode: '400', schema: refError, mediaType: 'application/json' }),
        ],
      }),
      createOperation({
        operationId: 'createPet',
        method: 'POST',
        path: '/pets',
        tags: ['pets'],
        requestBody: createSchema({ type: 'ref', ref: 'NewPet' }),
        responses: [createResponse({ statusCode: '201', schema: refPet, mediaType: 'application/json' })],
      }),
    ],
  })
}

describe('buildRefMap', () => {
  it('indexes all named schemas', () => {
    const map = buildRefMap(buildFixture())
    expect(map.size).toBe(6)
    for (const name of ['Pet', 'NewPet', 'PetList', 'Error', 'PetOrError', 'FullPet']) {
      expect(map.has(name)).toBe(true)
    }
  })

  it('skips unnamed (inline) schemas', () => {
    const root = createRoot({
      schemas: [createSchema({ type: 'object' }), createSchema({ name: 'Named', type: 'string' })],
    })
    const map = buildRefMap(root)
    expect(map.size).toBe(1)
    expect(map.has('Named')).toBe(true)
  })
})

describe('resolveRef', () => {
  it.each([
    { ref: 'Pet' },
    { ref: 'NewPet' },
    { ref: 'PetList' },
    { ref: 'Error' },
    { ref: 'PetOrError' },
    { ref: 'FullPet' },
  ])('resolves $ref to the correct SchemaNode', ({ ref }) => {
    const map = buildRefMap(buildFixture())
    const node = resolveRef(map, ref)
    expect(node?.kind).toBe('Schema')
    expect(node?.name).toBe(ref)
  })

  it('returns undefined for unknown refs', () => {
    const map = buildRefMap(buildFixture())
    expect(resolveRef(map, 'Unknown')).toBeUndefined()
  })
})

describe('buildRefMap snapshots', () => {
  const map = buildRefMap(buildFixture())

  it('full map (serialized to plain object)', () => {
    expect(refMapToObject(map)).toMatchSnapshot()
  })

  it.each([{ ref: 'Pet' }, { ref: 'PetList' }, { ref: 'PetOrError' }, { ref: 'FullPet' }])('resolved schema $ref', ({ ref }) => {
    expect(resolveRef(map, ref)).toMatchSnapshot()
  })
})
