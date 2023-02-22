import zod from 'zod'

import { petSchema } from './petSchema'

export const showPetByIdPathParamsSchema = zod.object({ petId: zod.string(), testId: zod.string() })
export const showPetByIdQueryParamsSchema = zod.object({})
export const showPetByIdResponseSchema = petSchema
