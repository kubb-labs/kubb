import { z } from 'zod'
import { userSchema } from './userSchema'

/**
 * @description successful operation
 */
export const createUserErrorSchema = z.lazy(() => userSchema).schema
/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema).schema

export const createUserMutationResponseSchema = z.any()
