import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { UpdateUserPathParams, UpdateUserRequestData, UpdateUserResponseData, UpdateUserStatusError } from '../../models/ts/userController/UpdateUser.ts'
import { userSchema } from '../userSchema.ts'

export const updateUserPathParamsSchema = z.object({
  username: z.string().describe('name that need to be deleted'),
}) as unknown as ToZod<UpdateUserPathParams>

export type UpdateUserPathParamsSchema = UpdateUserPathParams

/**
 * @description successful operation
 */
export const updateUserStatusErrorSchema = z.any() as unknown as ToZod<UpdateUserStatusError>

export type UpdateUserStatusErrorSchema = UpdateUserStatusError

/**
 * @description Update an existent user in the store
 */
export const updateUserRequestDataSchema = z.lazy(() => userSchema).schema.omit({ tag: true }) as unknown as ToZod<UpdateUserRequestData>

export type UpdateUserRequestDataSchema = UpdateUserRequestData

export const updateUserResponseDataSchema = z.any() as unknown as ToZod<UpdateUserResponseData>

export type UpdateUserResponseDataSchema = UpdateUserResponseData
