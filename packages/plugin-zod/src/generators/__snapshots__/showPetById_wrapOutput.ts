import { z } from '@hono/zod-openapi'

export const showPetByIdPathParams = z.object({
  petId: z.string().describe('The id of the pet to retrieve'),
  testId: z.string().describe('The id of the pet to retrieve'),
})

/**
 * @description Expected response to a valid request
 */
export const showPetById200 = z.lazy(() => pet)

/**
 * @description unexpected error
 */
export const showPetByIdError = z
  .lazy(() => error)
  .openapi({
    examples: [
      { sample: { summary: 'A sample error', value: { code: 1, message: 'A sample error message' } } },
      { other_example: { summary: 'Another sample error', value: { code: 2, message: 'A totally specific message' } } },
    ],
  })

export const showPetByIdQueryResponse = z.lazy(() => showPetById200)
