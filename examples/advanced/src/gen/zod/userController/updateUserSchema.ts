import { userSchema } from '../userSchema.ts'
import { z } from 'zod/v4'

export const updateUserPathParamsSchema = z.object({
  username: z.string().describe('name that need to be deleted'),
})

export type UpdateUserPathParamsSchema = z.infer<typeof updateUserPathParamsSchema>

/**
 * @description successful operation
 */
export const updateUserErrorSchema = z.any()

export type UpdateUserErrorSchema = z.infer<typeof updateUserErrorSchema>

/**
 * @description Update an existent user in the store
 */
export const updateUserMutationRequestSchema = userSchema.omit({ tag: true })

export type UpdateUserMutationRequestSchema = z.infer<typeof updateUserMutationRequestSchema>

export const updateUserMutationResponseSchema = z.any()

export type UpdateUserMutationResponseSchema = z.infer<typeof updateUserMutationResponseSchema>
