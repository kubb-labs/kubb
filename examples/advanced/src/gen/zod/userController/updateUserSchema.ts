import { userSchema } from '../userSchema.ts'
import { z } from 'zod'

export const updateUserPathParamsSchema = z.object({ username: z.string().describe('name that need to be deleted') })

/**
 * @description successful operation
 */
export const updateUserErrorSchema = z.any()

/**
 * @description Update an existent user in the store
 */
export const updateUserMutationRequestSchema = z.lazy(() => userSchema)

export const updateUserMutationResponseSchema = z.any()
