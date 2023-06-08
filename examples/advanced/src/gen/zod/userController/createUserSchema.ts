import { z } from 'zod'

import { userSchema } from '../userSchema'

export const createUserMutationResponseSchema = z.any()

/**
 * @description successful operation
 */
export const createUserErrorSchema = z.lazy(() => userSchema)

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema)
