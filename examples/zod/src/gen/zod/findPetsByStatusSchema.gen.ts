import { z } from '../../zod.ts'
import { petSchema } from './petSchema.gen'

export const findPetsByStatusQueryParamsSchema = z
  .object({ status: z.enum(['available', 'pending', 'sold']).default('available').describe('Status values that need to be considered for filter').optional() })
  .optional()
/**
 * @description successful operation
 */
export const findPetsByStatus200Schema = z.array(z.lazy(() => petSchema))
/**
 * @description Invalid status value
 */
export const findPetsByStatus400Schema = z.any()
/**
 * @description successful operation
 */
export const findPetsByStatusQueryResponseSchema = z.array(z.lazy(() => petSchema))
