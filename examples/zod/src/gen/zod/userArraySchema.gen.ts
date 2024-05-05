import { userSchema } from './userSchema.gen'
import { z } from 'zod'

export const userArraySchema = z.array(z.lazy(() => userSchema).schema)
