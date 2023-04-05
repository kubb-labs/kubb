import z from 'zod'

import { petSchema } from '../petSchema'

export const getPetByIdPathParamsSchema = z.object({ petId: z.number() })

/**
 * @description successful operation
 */
export const getPetByIdResponseSchema = z.lazy(() => petSchema)
