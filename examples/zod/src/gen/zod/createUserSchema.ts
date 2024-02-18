import { z } from 'zod'
import { userSchema } from './userSchema'

/**
 * @description successful operation
 */
export const createUserErrorSchema = z.any()
export const createUserMutationResponseSchema = z.any()

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema)
