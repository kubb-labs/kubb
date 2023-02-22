import zod from 'zod'

import { userSchema } from './userSchema'

export const updateUserPathParamsSchema = zod.object({ username: zod.string().optional() })
export const updateUserQueryParamsSchema = zod.object({})
export const updateUserRequestSchema = userSchema
export const updateUserResponseSchema = zod.any()
