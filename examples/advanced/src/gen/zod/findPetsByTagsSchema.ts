import zod from 'zod'

import { petSchema } from './petSchema'

export const findPetsByTagsPathParamsSchema = zod.object({})
export const findPetsByTagsQueryParamsSchema = zod.object({ tags: zod.array(zod.string()).optional() })
export const findPetsByTagsResponseSchema = zod.array(petSchema)
