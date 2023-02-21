import zod from 'zod'

import { petsSchema } from './petsSchema'

export const listPetsParamsSchema = zod.object({ limit: zod.string().optional() })
export const listPetsResponseSchema = petsSchema
