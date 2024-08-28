import { z } from '../../zod.ts'
import { userSchema } from './userSchema.gen.ts'

/**
 * @description Successful operation
 */
export const createUsersWithListInput200Schema = z.lazy(() => userSchema)

export type CreateUsersWithListInput200Schema = z.infer<typeof createUsersWithListInput200Schema>

/**
 * @description successful operation
 */
export const createUsersWithListInputErrorSchema = z.any()

export type CreateUsersWithListInputErrorSchema = z.infer<typeof createUsersWithListInputErrorSchema>

export const createUsersWithListInputMutationRequestSchema = z.array(z.lazy(() => userSchema))

export type CreateUsersWithListInputMutationRequestSchema = z.infer<typeof createUsersWithListInputMutationRequestSchema>

/**
 * @description Successful operation
 */
export const createUsersWithListInputMutationResponseSchema = z.lazy(() => userSchema)

export type CreateUsersWithListInputMutationResponseSchema = z.infer<typeof createUsersWithListInputMutationResponseSchema>
