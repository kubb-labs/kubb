import z from 'zod'

import { petSchema } from '../petSchema'

export const getPetByIdPathParamsSchema = z.object({ petId: z.number() })

/**
 * @description Invalid ID supplied
 */
export const getPetById400Schema = z.any()

/**
 * @description Pet not found
 */
export const getPetById404Schema = z.any()

/**
 * @description successful operation
 */
export const getPetByIdResponseSchema = z.lazy(() => petSchema)
