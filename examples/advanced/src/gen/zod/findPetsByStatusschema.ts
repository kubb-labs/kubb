import zod from 'zod'

import { petSchema } from './petSchema'

export const findPetsByStatusParamsSchema = zod.object({ status: zod.enum(['available', 'pending', 'sold']).optional() })
export const findPetsByStatusResponseSchema = zod.array(petSchema)
