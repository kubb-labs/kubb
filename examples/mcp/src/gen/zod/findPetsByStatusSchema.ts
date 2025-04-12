import { petSchema } from './petSchema.js'
import { z } from 'zod'

export const findPetsByStatusQueryParamsSchema = z
  .object({
    status: z.enum(['available', 'pending', 'sold']).default('available').describe('Status values that need to be considered for filter'),
  })
  .optional()

/**
 * @description successful operation
 */
export const findPetsByStatus200Schema = z.array(z.lazy(() => petSchema))

/**
 * @description Invalid status value
 */
export const findPetsByStatus400Schema = z.any()

export const findPetsByStatusQueryResponseSchema = z.lazy(() => findPetsByStatus200Schema)
