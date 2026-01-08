import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { DeleteUserPathParams, DeleteUserResponseData, DeleteUserStatus400, DeleteUserStatus404 } from '../../models/ts/userController/DeleteUser.ts'

export const deleteUserPathParamsSchema = z.object({
  username: z.string().describe('The name that needs to be deleted'),
}) as unknown as ToZod<DeleteUserPathParams>

export type DeleteUserPathParamsSchema = DeleteUserPathParams

/**
 * @description Invalid username supplied
 */
export const deleteUserStatus400Schema = z.any() as unknown as ToZod<DeleteUserStatus400>

export type DeleteUserStatus400Schema = DeleteUserStatus400

/**
 * @description User not found
 */
export const deleteUserStatus404Schema = z.any() as unknown as ToZod<DeleteUserStatus404>

export type DeleteUserStatus404Schema = DeleteUserStatus404

export const deleteUserResponseDataSchema = z.any() as unknown as ToZod<DeleteUserResponseData>

export type DeleteUserResponseDataSchema = DeleteUserResponseData
