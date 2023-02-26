import z from 'zod'

import { userSchema } from './userSchema'

export const getUserByNamePathParamsSchema = z.object({ username: z.string() })
export const getUserByNameQueryParamsSchema = z.object({})

/**
 * @description successful operation
 */
export const getUserByNameResponseSchema = userSchema
