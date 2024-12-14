import type {
  GetUserByNamePathParams,
  GetUserByName200,
  GetUserByName400,
  GetUserByName404,
  GetUserByNameQueryResponse,
} from '../../models/ts/userController/GetUserByName.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { userSchema } from '../userSchema.ts'
import { z } from 'zod'

export const getUserByNamePathParamsSchema = z.object({
  username: z.string().describe('The name that needs to be fetched. Use user1 for testing. '),
} satisfies ToZod<GetUserByNamePathParams>)

export type GetUserByNamePathParamsSchema = GetUserByNamePathParams

/**
 * @description successful operation
 */
export const getUserByName200Schema = z.lazy(() => userSchema)

export type GetUserByName200Schema = GetUserByName200

/**
 * @description Invalid username supplied
 */
export const getUserByName400Schema = z.any()

export type GetUserByName400Schema = GetUserByName400

/**
 * @description User not found
 */
export const getUserByName404Schema = z.any()

export type GetUserByName404Schema = GetUserByName404

export const getUserByNameQueryResponseSchema = z.lazy(() => getUserByName200Schema)

export type GetUserByNameQueryResponseSchema = GetUserByNameQueryResponse
