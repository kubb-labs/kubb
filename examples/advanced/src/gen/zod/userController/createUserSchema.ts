import { userSchema } from '../userSchema.ts'
import { z } from 'zod'

/**
 * @description successful operation
 */
export const createUserErrorSchema = z.lazy(() => userSchema)

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema)

export const createUserMutationResponseSchema = z.any()
