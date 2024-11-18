import { petSchema } from '../petSchema.ts'
import { z } from 'zod'

export const findPetsByStatusPathParamsSchema = z.object({ step_id: z.string() })

export type FindPetsByStatusPathParamsSchema = z.infer<typeof findPetsByStatusPathParamsSchema>

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

export const findPetsByStatusQueryResponseSchema = z.lazy(() => findPetsByStatus200Schema)

export type FindPetsByStatusQueryResponseSchema = z.infer<typeof findPetsByStatusQueryResponseSchema>
