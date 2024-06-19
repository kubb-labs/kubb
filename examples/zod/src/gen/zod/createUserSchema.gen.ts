import { z } from '../../zod.ts'
import { userSchema } from './userSchema.gen'

/**
 * @description successful operation
 */
export const createUserErrorSchema = z.lazy(() => userSchema)
/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema)

export const createUserMutationResponseSchema = z.any()
