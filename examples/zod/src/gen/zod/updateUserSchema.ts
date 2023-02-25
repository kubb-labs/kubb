import zod from 'zod'

import { userSchema } from './userSchema'

export const updateUserPathParamsSchema = zod.object({ username: zod.string() })
export const updateUserQueryParamsSchema = zod.object({})
export const updateUserResponseSchema = zod.any()
export const updateUserRequestSchema = userSchema
