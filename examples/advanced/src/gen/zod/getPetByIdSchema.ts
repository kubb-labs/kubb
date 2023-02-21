import zod from 'zod'

import { petSchema } from './petSchema'

export const getPetByIdParamsSchema = zod.object({ petId: zod.number().optional() })
export const getPetByIdResponseSchema = petSchema
