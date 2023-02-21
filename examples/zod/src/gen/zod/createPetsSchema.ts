import zod from 'zod'

import { petSchema } from './petSchema'

export const createPetsRequestSchema = zod.object({ name: zod.string(), tag: zod.string() })
export const createPetsResponseSchema = petSchema
