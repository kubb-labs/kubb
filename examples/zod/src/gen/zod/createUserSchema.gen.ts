import { z } from '../../zod.ts'
import { userSchema } from './userSchema.gen.ts'

/**
 * @description successful operation
 */
export const createUserErrorSchema = z.lazy(() => userSchema)

export type CreateUserErrorSchema = z.infer<typeof createUserErrorSchema>

/**
 * @description Created user object
 */
export const createUserMutationRequestSchema = z.lazy(() => userSchema)

export type CreateUserMutationRequestSchema = z.infer<typeof createUserMutationRequestSchema>

export const createUserMutationResponseSchema = z.any()

export type CreateUserMutationResponseSchema = z.infer<typeof createUserMutationResponseSchema>
