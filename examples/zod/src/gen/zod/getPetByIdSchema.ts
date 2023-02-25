import zod from 'zod'

import { petSchema } from './petSchema'

export const getPetByIdPathParamsSchema = zod.object({ petId: zod.number() })
export const getPetByIdQueryParamsSchema = zod.object({})
export const getPetByIdResponseSchema = petSchema
