import z from 'zod'

import { petSchema } from './petSchema'

export const findPetsByStatusPathParamsSchema = z.object({})
export const findPetsByStatusQueryParamsSchema = z.object({ status: z.enum([`available`, `pending`, `sold`]).optional() })

/**
 * @description successful operation
 */
export const findPetsByStatusResponseSchema = z.array(z.lazy(() => petSchema))
