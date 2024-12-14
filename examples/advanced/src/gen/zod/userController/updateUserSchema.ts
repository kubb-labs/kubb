import type { UpdateUserPathParams, UpdateUserError, UpdateUserMutationRequest, UpdateUserMutationResponse } from '../../models/ts/userController/UpdateUser.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { userSchema } from '../userSchema.ts'
import { z } from 'zod'

export const updateUserPathParamsSchema = z.object({
  username: z.string().describe('name that need to be deleted'),
} satisfies ToZod<UpdateUserPathParams>)

export type UpdateUserPathParamsSchema = UpdateUserPathParams

/**
 * @description successful operation
 */
export const updateUserErrorSchema = z.any()

export type UpdateUserErrorSchema = UpdateUserError

/**
 * @description Update an existent user in the store
 */
export const updateUserMutationRequestSchema = z.lazy(() => userSchema)

export type UpdateUserMutationRequestSchema = UpdateUserMutationRequest

export const updateUserMutationResponseSchema = z.any()

export type UpdateUserMutationResponseSchema = UpdateUserMutationResponse
