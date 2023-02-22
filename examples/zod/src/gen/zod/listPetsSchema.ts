import zod from 'zod'

import { petsSchema } from './petsSchema'

export const listPetsPathParamsSchema = zod.object({})
export const listPetsQueryParamsSchema = zod.object({ limit: zod.string().optional() })
export const listPetsResponseSchema = petsSchema
