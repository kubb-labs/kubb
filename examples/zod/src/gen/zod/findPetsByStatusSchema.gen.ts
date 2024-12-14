import { z } from '../../zod.ts'
import { petSchema } from './petSchema.gen.ts'

export const findPetsByStatusQueryParamsSchema = z
  .object({
    status: z.enum(['available', 'pending', 'sold']).default('available').describe('Status values that need to be considered for filter'),
  })
  .optional()

export type FindPetsByStatusQueryParamsSchema = z.infer<typeof findPetsByStatusQueryParamsSchema>

/**
 * @description successful operation
 */
export const findPetsByStatus200Schema = z.array(z.lazy(() => petSchema))

export type FindPetsByStatus200Schema = z.infer<typeof findPetsByStatus200Schema>

/**
 * @description Invalid status value
 */
export const findPetsByStatus400Schema = z.any()

export type FindPetsByStatus400Schema = z.infer<typeof findPetsByStatus400Schema>

export const findPetsByStatusQueryResponseSchema = z.lazy(() => findPetsByStatus200Schema)

export type FindPetsByStatusQueryResponseSchema = z.infer<typeof findPetsByStatusQueryResponseSchema>