import * as z from 'zod'
import { petSchema } from '../petSchema.ts'

export const findPetsByStatusPathParamsSchema = z.object({
  stepId: z.string(),
})

export type FindPetsByStatusPathParamsSchema = z.infer<typeof findPetsByStatusPathParamsSchema>

/**
 * @description successful operation
 */
export const findPetsByStatus200Schema = z
  .array(petSchema)
  .min(1)
  .max(3)
  .refine((items) => new Set(items).size === items.length, { message: 'Array entries must be unique' })

export type FindPetsByStatus200Schema = z.infer<typeof findPetsByStatus200Schema>

/**
 * @description Invalid status value
 */
export const findPetsByStatus400Schema = z.any()

export type FindPetsByStatus400Schema = z.infer<typeof findPetsByStatus400Schema>

export const findPetsByStatusQueryResponseSchema = findPetsByStatus200Schema

export type FindPetsByStatusQueryResponseSchema = z.infer<typeof findPetsByStatusQueryResponseSchema>

export const findPetsByStatusQuerySchema = z.object({
  Response: findPetsByStatus200Schema,
  PathParams: findPetsByStatusPathParamsSchema,
  Errors: findPetsByStatus400Schema,
})

export type FindPetsByStatusQuerySchema = z.infer<typeof findPetsByStatusQuerySchema>
