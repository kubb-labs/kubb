import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type {
  GetUserByNamePathParams,
  GetUserByNameResponseData,
  GetUserByNameStatus200,
  GetUserByNameStatus400,
  GetUserByNameStatus404,
} from '../../models/ts/userController/GetUserByName.ts'
import { userSchema } from '../userSchema.ts'

export const getUserByNamePathParamsSchema = z.object({
  username: z.string().describe('The name that needs to be fetched. Use user1 for testing. '),
}) as unknown as ToZod<GetUserByNamePathParams>

export type GetUserByNamePathParamsSchema = GetUserByNamePathParams

/**
 * @description successful operation
 */
export const getUserByNameStatus200Schema = z.lazy(() => userSchema) as unknown as ToZod<GetUserByNameStatus200>

export type GetUserByNameStatus200Schema = GetUserByNameStatus200

/**
 * @description Invalid username supplied
 */
export const getUserByNameStatus400Schema = z.any() as unknown as ToZod<GetUserByNameStatus400>

export type GetUserByNameStatus400Schema = GetUserByNameStatus400

/**
 * @description User not found
 */
export const getUserByNameStatus404Schema = z.any() as unknown as ToZod<GetUserByNameStatus404>

export type GetUserByNameStatus404Schema = GetUserByNameStatus404

export const getUserByNameResponseDataSchema = z.lazy(() => getUserByNameStatus200Schema) as unknown as ToZod<GetUserByNameResponseData>

export type GetUserByNameResponseDataSchema = GetUserByNameResponseData
