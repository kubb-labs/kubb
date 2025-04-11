import type { DeleteUserPathParamsType, DeleteUser400Type, DeleteUser404Type, DeleteUserMutationResponseType } from '../ts/DeleteUserType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

export const deleteUserPathParamsSchema = z.object({
  username: z.string().describe('The name that needs to be deleted'),
}) as unknown as ToZod<DeleteUserPathParamsType>

export type DeleteUserPathParamsSchema = DeleteUserPathParamsType

/**
 * @description Invalid username supplied
 */
export const deleteUser400Schema = z.any() as unknown as ToZod<DeleteUser400Type>

export type DeleteUser400Schema = DeleteUser400Type

/**
 * @description User not found
 */
export const deleteUser404Schema = z.any() as unknown as ToZod<DeleteUser404Type>

export type DeleteUser404Schema = DeleteUser404Type

export const deleteUserMutationResponseSchema = z.any() as unknown as ToZod<DeleteUserMutationResponseType>

export type DeleteUserMutationResponseSchema = DeleteUserMutationResponseType