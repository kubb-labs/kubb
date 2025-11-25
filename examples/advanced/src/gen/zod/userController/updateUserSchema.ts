import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { UpdateUserError, UpdateUserMutationRequest, UpdateUserMutationResponse, UpdateUserPathParams } from '../../models/ts/userController/UpdateUser.ts'
import { userSchema } from '../userSchema.ts'

export const updateUserPathParamsSchema = z.object({
  username: z.string().describe('name that need to be deleted'),
}) as unknown as ToZod<UpdateUserPathParams>

export type UpdateUserPathParamsSchema = UpdateUserPathParams

/**
 * @description successful operation
 */
export const updateUserErrorSchema = z.any() as unknown as ToZod<UpdateUserError>

export type UpdateUserErrorSchema = UpdateUserError

/**
 * @description Update an existent user in the store
 */
export const updateUserMutationRequestSchema = z.lazy(() => userSchema).schema.omit({ tag: true }) as unknown as ToZod<UpdateUserMutationRequest>

export type UpdateUserMutationRequestSchema = UpdateUserMutationRequest

export const updateUserMutationResponseSchema = z.any() as unknown as ToZod<UpdateUserMutationResponse>

export type UpdateUserMutationResponseSchema = UpdateUserMutationResponse
