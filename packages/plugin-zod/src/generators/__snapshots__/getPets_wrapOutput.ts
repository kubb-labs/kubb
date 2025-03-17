import { z } from '@hono/zod-openapi'

export const listPetsQueryParams = z
  .object({
    limit: z.string().describe('How many items to return at one time (max 100)').optional(),
    offset: z.number().int().default(0),
  })
  .optional()

/**
 * @description A paged array of pets
 */
export const listPets200 = z.lazy(() => pets)

/**
 * @description unexpected error
 */
export const listPetsError = z
  .lazy(() => error)
  .openapi({
    examples: [
      { sample: { summary: 'A sample error', value: { code: 1, message: 'A sample error message' } } },
      { other_example: { summary: 'Another sample error', value: { code: 2, message: 'A totally specific message' } } },
    ],
  })

export const listPetsQueryResponse = z.lazy(() => listPets200)
