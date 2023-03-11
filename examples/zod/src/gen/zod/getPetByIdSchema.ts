import z from 'zod'

import { petSchema } from './petSchema'

export const getPetByIdPathParamsSchema = z.object({ petId: z.number() })
export const getPetByIdQueryParamsSchema = z.object({})

/**
 * @description successful operation
 */
export const getPetByIdResponseSchema = z.lazy(() => petSchema)
