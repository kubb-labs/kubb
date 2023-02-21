import zod from 'zod'

import { userSchema } from './userSchema'

export const updateUserParamsSchema = zod.object({ username: zod.string().optional() })
export const updateUserRequestSchema = userSchema
export const updateUserResponseSchema = zod.any()
