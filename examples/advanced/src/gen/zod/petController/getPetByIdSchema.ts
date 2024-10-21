import { petSchema } from '../petSchema.ts'
import { z } from 'zod'

export const getPetByIdPathParamsSchema = z.object({ petId: z.number().int().describe('ID of pet to return') })

export type GetPetByIdPathParamsSchema = z.infer<typeof getPetByIdPathParamsSchema>

/**
 * @description successful operation
 */
export const getPetById200Schema = z.lazy(() => petSchema).and(z.object({ name: z.never() }))

export type GetPetById200Schema = z.infer<typeof getPetById200Schema>

/**
 * @description Invalid ID supplied
 */
export const getPetById400Schema = z.any()

export type GetPetById400Schema = z.infer<typeof getPetById400Schema>

/**
 * @description Pet not found
 */
export const getPetById404Schema = z.any()

export type GetPetById404Schema = z.infer<typeof getPetById404Schema>

export const getPetByIdQueryResponseSchema = z.lazy(() => getPetById200Schema)

export type GetPetByIdQueryResponseSchema = z.infer<typeof getPetByIdQueryResponseSchema>
