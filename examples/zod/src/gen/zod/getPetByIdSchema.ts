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
export const getPetByIdPathParamsSchema = z.object({ petId: z.number() })

/**
 * @description successful operation
 */
export const getPetByIdQueryResponseSchema = z.lazy(() => petSchema)
