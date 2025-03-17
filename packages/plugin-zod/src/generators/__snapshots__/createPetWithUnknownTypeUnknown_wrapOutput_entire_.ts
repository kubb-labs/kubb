import { z } from '@hono/zod-openapi'

/**
 * @description Null response
 */
export const createPets201 = z.unknown()

/**
 * @description unexpected error
 */
export const createPetsError = extendApi(
  z.lazy(() => error),
  {
    examples: [
      { sample: { summary: 'A sample error', value: { code: 1, message: 'A sample error message' } } },
      { other_example: { summary: 'Another sample error', value: { code: 2, message: 'A totally specific message' } } },
    ],
  },
)

export const createPetsMutationRequest = z.object({
  name: extendApi(z.string(), { example: 'Baxter' }),
  tag: z.string(),
})

export const createPetsMutationResponse = z.lazy(() => createPets201)
