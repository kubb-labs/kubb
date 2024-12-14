import type { DeleteUserPathParams, DeleteUser400, DeleteUser404, DeleteUserMutationResponse } from '../../models/ts/userController/DeleteUser.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const deleteUserPathParamsSchema = z.object({
  username: z.string().describe('The name that needs to be deleted'),
} satisfies ToZod<DeleteUserPathParams>)

export type DeleteUserPathParamsSchema = DeleteUserPathParams

/**
 * @description Invalid username supplied
 */
export const deleteUser400Schema = z.any()

export type DeleteUser400Schema = DeleteUser400

/**
 * @description User not found
 */
export const deleteUser404Schema = z.any()

export type DeleteUser404Schema = DeleteUser404

export const deleteUserMutationResponseSchema = z.any()

export type DeleteUserMutationResponseSchema = DeleteUserMutationResponse
