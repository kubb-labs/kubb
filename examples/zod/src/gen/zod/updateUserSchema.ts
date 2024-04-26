import { z } from 'zod'
import { userSchema } from './userSchema'

export const updateUserPathParamsSchema = z.object({ username: z.string().describe('name that need to be deleted') })

/**
 * @description successful operation
 */
export const updateUserErrorSchema = z.any()

/**
 * @description Update an existent user in the store
 */
export const updateUserMutationRequestSchema = z.lazy(() => userSchema).schema

export const updateUserMutationResponseSchema = z.any()
