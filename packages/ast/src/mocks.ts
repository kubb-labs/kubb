import { createOperation, createParameter, createProperty, createResponse, createRoot, createSchema } from './factory.ts'
import type { RootNode } from './nodes/root.ts'

/**
 * Minimal single-resource tree: one `Pet` schema and one `getPetById` operation.
 */
export function buildSampleTree(): RootNode {
  const petSchema = createSchema({
    type: 'object',
    name: 'Pet',
    properties: [
      createProperty({ name: 'id', schema: createSchema({ type: 'integer' }), required: true }),
      createProperty({ name: 'name', schema: createSchema({ type: 'string' }), required: true }),
    ],
  })

  const operation = createOperation({
    operationId: 'getPetById',
    method: 'GET',
    path: '/pets/{petId}',
    tags: ['pets'],
    parameters: [createParameter({ name: 'petId', in: 'path', schema: createSchema({ type: 'integer' }), required: true })],
    responses: [createResponse({ statusCode: '200', schema: createSchema({ type: 'ref', name: 'Pet' }) }), createResponse({ statusCode: '404' })],
  })

  return createRoot({ schemas: [petSchema], operations: [operation] })
}

/**
 * Petstore-like tree: six named schemas (`Pet`, `NewPet`, `PetList`, `Error`, `PetOrError`, `FullPet`)
 * and two operations (`listPets`, `createPet`).
 */
export function buildFixture(): RootNode {
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
