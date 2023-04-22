import z from 'zod'

import { petSchema } from './petSchema'

/**
 * @description Invalid status value
 */
export const findPetsByStatus400Schema = z.any()
export const findPetsByStatusQueryParamsSchema = z.object({ status: z.enum([`available`, `pending`, `sold`]).optional() })

/**
 * @description successful operation
 */
export const findPetsByStatusQueryResponseSchema = z.array(z.lazy(() => petSchema))
