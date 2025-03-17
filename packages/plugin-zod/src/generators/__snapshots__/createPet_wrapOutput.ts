import { z } from '@hono/zod-openapi'

/**
 * @description Null response
 */
export const createPets201 = z.any()

/**
 * @description unexpected error
 */
export const createPetsError = z
  .lazy(() => error)
  .openapi({
    examples: [
      { sample: { summary: 'A sample error', value: { code: 1, message: 'A sample error message' } } },
      { other_example: { summary: 'Another sample error', value: { code: 2, message: 'A totally specific message' } } },
    ],
  })

export const createPetsMutationRequest = z.object({
  name: z.string().openapi({ example: 'Baxter' }),
  tag: z.string(),
})

export const createPetsMutationResponse = z.lazy(() => createPets201)
