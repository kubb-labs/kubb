import zod from 'zod'

import { petSchema } from './petSchema'

export const showPetByIdPathParamsSchema = zod.object({ petId: zod.string().optional(), testId: zod.string().optional() })
export const showPetByIdQueryParamsSchema = zod.object({})
export const showPetByIdResponseSchema = petSchema
