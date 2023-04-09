import z from 'zod'

import { userSchema } from '../userSchema'

export const createUserResponseSchema = z.any()

/**
 * @description successful operation
 */
export const createUserErrorSchema = z.lazy(() => userSchema)

/**
 * @description Created user object
 */
export const createUserRequestSchema = z.lazy(() => userSchema)
