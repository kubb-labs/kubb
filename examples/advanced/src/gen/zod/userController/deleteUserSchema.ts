import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { DeleteUser400, DeleteUser404, DeleteUserMutationResponse, DeleteUserPathParams } from '../../models/ts/userController/DeleteUser.ts'

export const deleteUserPathParamsSchema = z.object({
  username: z.string().describe('The name that needs to be deleted'),
}) as unknown as ToZod<DeleteUserPathParams>

export type DeleteUserPathParamsSchema = DeleteUserPathParams

/**
 * @description Invalid username supplied
 */
export const deleteUser400Schema = z.any() as unknown as ToZod<DeleteUser400>

export type DeleteUser400Schema = DeleteUser400

/**
 * @description User not found
 */
export const deleteUser404Schema = z.any() as unknown as ToZod<DeleteUser404>

export type DeleteUser404Schema = DeleteUser404

export const deleteUserMutationResponseSchema = z.any() as unknown as ToZod<DeleteUserMutationResponse>

export type DeleteUserMutationResponseSchema = DeleteUserMutationResponse
