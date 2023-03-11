import z from 'zod'

import { petSchema } from './petSchema'

export const findPetsByTagsPathParamsSchema = z.object({})
export const findPetsByTagsQueryParamsSchema = z.object({ tags: z.array(z.string()).optional() })

/**
 * @description successful operation
 */
export const findPetsByTagsResponseSchema = z.array(z.lazy(() => petSchema))
