import { z } from 'zod/v4'
import { userSchema } from '../userSchema.ts'

/**
 * @description successful operation
 */
export const createUserErrorSchema = userSchema

export type CreateUserErrorSchema = z.infer<typeof createUserErrorSchema>

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = userSchema.omit({ tag: true })

export type CreateUserMutationRequestSchema = z.infer<typeof createUserMutationRequestSchema>

export const createUserMutationResponseSchema = z.any()

export type CreateUserMutationResponseSchema = z.infer<typeof createUserMutationResponseSchema>
