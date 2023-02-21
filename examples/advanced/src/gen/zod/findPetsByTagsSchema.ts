import zod from 'zod'

import { petSchema } from './petSchema'

export const findPetsByTagsParamsSchema = zod.object({ tags: zod.array(zod.string()).optional() })
export const findPetsByTagsResponseSchema = zod.array(petSchema)
