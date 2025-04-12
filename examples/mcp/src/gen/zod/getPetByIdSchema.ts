import { petSchema } from './petSchema.js'
import { z } from 'zod'

export const getPetByIdPathParamsSchema = z.object({
  petId: z.number().int().describe('ID of pet to return'),
})

/**
 * @description successful operation
 */
export const getPetById200Schema = z.lazy(() => petSchema)

/**
 * @description Invalid ID supplied
 */
export const getPetById400Schema = z.any()

/**
 * @description Pet not found
 */
export const getPetById404Schema = z.any()

export const getPetByIdQueryResponseSchema = z.lazy(() => getPetById200Schema)
