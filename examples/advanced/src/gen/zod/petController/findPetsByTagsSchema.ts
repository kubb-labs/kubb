import z from 'zod'

import { petSchema } from '../petSchema'

export const findPetsByTagsQueryParamsSchema = z.object({ tags: z.array(z.string()).optional() })

/**
 * @description Invalid tag value
 */
export const findPetsByTags400Schema = z.any()

/**
 * @description successful operation
 */
export const findPetsByTagsResponseSchema = z.array(z.lazy(() => petSchema))
