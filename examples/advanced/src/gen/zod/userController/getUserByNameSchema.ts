import type {
  GetUserByNamePathParams,
  GetUserByName200,
  GetUserByName400,
  GetUserByName404,
  GetUserByNameQueryResponse,
} from '../../models/ts/userController/GetUserByName.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { userSchema } from '../userSchema.ts'
import { z } from 'zod/v4'

export const getUserByNamePathParamsSchema = z.object({
  username: z.string().describe('The name that needs to be fetched. Use user1 for testing. '),
}) as unknown as ToZod<GetUserByNamePathParams>

export type GetUserByNamePathParamsSchema = GetUserByNamePathParams

/**
 * @description successful operation
 */
export const getUserByName200Schema = userSchema as unknown as ToZod<GetUserByName200>

export type GetUserByName200Schema = GetUserByName200

/**
 * @description Invalid username supplied
 */
export const getUserByName400Schema = z.any() as unknown as ToZod<GetUserByName400>

export type GetUserByName400Schema = GetUserByName400

/**
 * @description User not found
 */
export const getUserByName404Schema = z.any() as unknown as ToZod<GetUserByName404>

export type GetUserByName404Schema = GetUserByName404

export const getUserByNameQueryResponseSchema = getUserByName200Schema as unknown as ToZod<GetUserByNameQueryResponse>

export type GetUserByNameQueryResponseSchema = GetUserByNameQueryResponse
