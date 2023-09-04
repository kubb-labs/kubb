import { z } from 'zod'

import { petSchema } from '../petSchema'

/**
 * @description Invalid tag value
 */
export const findPetsByTags400Schema = z.any()
export const findPetsByTagsQueryParamsSchema = z.object({ tags: z.array(z.string()).optional(), page: z.string().optional(), pageSize: z.string().optional() })

/**
 * @description successful operation
 */
export const findPetsByTagsQueryResponseSchema = z.array(z.lazy(() => petSchema))
