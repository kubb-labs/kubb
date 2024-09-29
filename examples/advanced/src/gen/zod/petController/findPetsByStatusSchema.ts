import { petSchema } from '../petSchema.js'
import { z } from 'zod'

export const findPetsByStatusQueryParamsSchema = z
  .object({ status: z.enum(['available', 'pending', 'sold']).default('available').describe('Status values that need to be considered for filter').optional() })
  .optional()

export type FindPetsByStatusQueryParamsSchema = z.infer<typeof findPetsByStatusQueryParamsSchema>

/**
 * @description successful operation
 */
export const findPetsByStatus200Schema = z
  .array(z.lazy(() => petSchema))
  .min(1)
  .max(3)

export type FindPetsByStatus200Schema = z.infer<typeof findPetsByStatus200Schema>

/**
 * @description Invalid status value
 */
export const findPetsByStatus400Schema = z.any()

export type FindPetsByStatus400Schema = z.infer<typeof findPetsByStatus400Schema>

/**
 * @description successful operation
 */
export const findPetsByStatusQueryResponseSchema = z
  .array(z.lazy(() => petSchema))
  .min(1)
  .max(3)

export type FindPetsByStatusQueryResponseSchema = z.infer<typeof findPetsByStatusQueryResponseSchema>
