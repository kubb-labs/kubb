import zod from 'zod'

import { userSchema } from './userSchema'

export const getUserByNameParamsSchema = zod.object({ username: zod.string().optional() })
export const getUserByNameResponseSchema = userSchema
