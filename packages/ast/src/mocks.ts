import { createInput } from './nodes/input.ts'
import type { InputNode } from './nodes/input.ts'
import { createOperation } from './nodes/operation.ts'
import { createParameter } from './nodes/parameter.ts'
import { createProperty } from './nodes/property.ts'
import { createResponse } from './nodes/response.ts'
import { createSchema } from './nodes/schema.ts'

/**
 * Builds a minimal sample AST with one `Pet` schema and one `getPetById` operation.
 */
export function buildSampleTree(): InputNode {
  const petSchema = createSchema({
    type: 'object',
    name: 'Pet',
    properties: [
      createProperty({
        name: 'id',
        schema: createSchema({ type: 'integer' }),
        required: true,
      }),
      createProperty({
        name: 'name',
        schema: createSchema({ type: 'string' }),
        required: true,
      }),
    ],
  })

  const operation = createOperation({
    operationId: 'getPetById',
    method: 'GET',
    path: '/pets/{petId}',
    tags: ['pets'],
    parameters: [
      createParameter({
        name: 'petId',
        in: 'path',
        schema: createSchema({ type: 'integer' }),
        required: true,
      }),
    ],
    responses: [
      createResponse({
        statusCode: '200',
        schema: createSchema({ type: 'ref', name: 'Pet' }),
      }),
      createResponse({
        statusCode: '404',
        schema: createSchema({ type: 'ref', name: 'Error' }),
      }),
    ],
  })

  return createInput({ schemas: [petSchema], operations: [operation] })
}
