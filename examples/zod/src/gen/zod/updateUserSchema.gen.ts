import type { UpdateUserPathParamsType, UpdateUserErrorType, UpdateUserMutationRequestType, UpdateUserMutationResponseType } from '../ts/UpdateUserType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { userSchema } from './userSchema.gen.ts'

export const updateUserPathParamsSchema = z.object({
  username: z.string().describe('name that need to be deleted'),
}) as unknown as ToZod<UpdateUserPathParamsType>

export type UpdateUserPathParamsSchema = UpdateUserPathParamsType

/**
 * @description successful operation
 */
export const updateUserErrorSchema = z.any() as unknown as ToZod<UpdateUserErrorType>

export type UpdateUserErrorSchema = UpdateUserErrorType

/**
 * @description Update an existent user in the store
 */
export const updateUserMutationRequestSchema = z.lazy(() => userSchema) as unknown as ToZod<UpdateUserMutationRequestType>

export type UpdateUserMutationRequestSchema = UpdateUserMutationRequestType

export const updateUserMutationResponseSchema = z.any() as unknown as ToZod<UpdateUserMutationResponseType>

export type UpdateUserMutationResponseSchema = UpdateUserMutationResponseType
