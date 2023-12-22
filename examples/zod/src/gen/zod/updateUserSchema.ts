import { z } from 'zod'
import { userSchema } from './userSchema'

/**
 * @description successful operation
 */
export const updateUserErrorSchema = z.any()
export const updateUserMutationResponseSchema = z.any()
export const updateUserPathParamsSchema = z.object({ username: z.string().describe(`name that need to be deleted`) })

/**
 * @description Update an existent user in the store
 */
export const updateUserMutationRequestSchema = z.lazy(() => userSchema)
