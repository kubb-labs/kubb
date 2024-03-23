import { z } from 'zod'
import { petSchema } from './petSchema'

/**
 * @description Invalid ID supplied
 */
export const getPetById400Schema = z.any()

/**
 * @description Pet not found
 */
export const getPetById404Schema = z.any()

export const getPetByIdPathParamsSchema = z.object({ petId: z.number().describe('ID of pet to return') })

/**
 * @description successful operation
 */
export const getPetById200Schema = z.lazy(() => petSchema)

/**
 * @description successful operation
 */
export const getPetByIdQueryResponseSchema = z.lazy(() => petSchema)
