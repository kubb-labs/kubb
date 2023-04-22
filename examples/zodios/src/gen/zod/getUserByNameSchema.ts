import z from 'zod'

import { userSchema } from './userSchema'

/**
 * @description Invalid username supplied
 */
export const getUserByName400Schema = z.any()

/**
 * @description User not found
 */
export const getUserByName404Schema = z.any()
export const getUserByNamePathParamsSchema = z.object({ username: z.string() })

/**
 * @description successful operation
 */
export const getUserByNameQueryResponseSchema = z.lazy(() => userSchema)
