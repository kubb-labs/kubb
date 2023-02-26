import z from 'zod'

import { userSchema } from './userSchema'

export const updateUserPathParamsSchema = z.object({ username: z.string() })
export const updateUserQueryParamsSchema = z.object({})
export const updateUserResponseSchema = z.any()

/**
 * @description Update an existent user in the store
 */
export const updateUserRequestSchema = userSchema
