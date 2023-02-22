import zod from 'zod'

import { userSchema } from './userSchema'

export const getUserByNamePathParamsSchema = zod.object({ username: zod.string().optional() })
export const getUserByNameQueryParamsSchema = zod.object({})
export const getUserByNameResponseSchema = userSchema
