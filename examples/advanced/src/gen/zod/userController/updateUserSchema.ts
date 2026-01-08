import type { UpdateUserPathParams, UpdateUserStatusError, UpdateUserRequestData, UpdateUserResponseData } from '../../models/ts/userController/UpdateUser.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { userSchema } from '../userSchema.ts'
import { z } from 'zod'

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
