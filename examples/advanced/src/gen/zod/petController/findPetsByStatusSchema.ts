import z from 'zod'

import { petSchema } from '../petSchema'

export const findPetsByStatusQueryParamsSchema = z.object({ status: z.enum([`available`, `pending`, `sold`]).optional() })

/**
 * @description Invalid status value
 */
export const findPetsByStatus400Schema = z.any()

/**
 * @description successful operation
 */
export const findPetsByStatusResponseSchema = z.array(z.lazy(() => petSchema))
