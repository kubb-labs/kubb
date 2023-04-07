import z from 'zod'

import { userSchema } from './userSchema'

export const getUserByNamePathParamsSchema = z.object({ username: z.string() })

/**
 * @description Invalid username supplied
 */
export const getUserByName400Schema = z.any()

/**
 * @description User not found
 */
export const getUserByName404Schema = z.any()

/**
 * @description successful operation
 */
export const getUserByNameResponseSchema = z.lazy(() => userSchema)
