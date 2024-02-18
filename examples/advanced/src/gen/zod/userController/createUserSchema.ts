import { z } from 'zod'
import { userSchema } from '../userSchema'

export const createUserMutationResponseSchema = z.any()

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema)
