import zod from 'zod'

import { Pet } from './Pet'

export const FindPetsByTagsParams = zod.object({ tags: zod.array(zod.string()).optional() })
export const FindPetsByTagsResponse = zod.array(Pet)
