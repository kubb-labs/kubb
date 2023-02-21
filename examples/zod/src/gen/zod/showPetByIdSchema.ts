import zod from 'zod'

import { petSchema } from './petSchema'

export const showPetByIdParamsSchema = zod.object({ petId: zod.string().optional(), testId: zod.string().optional() })
export const showPetByIdResponseSchema = petSchema
