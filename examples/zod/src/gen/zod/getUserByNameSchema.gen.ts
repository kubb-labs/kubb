import type {
  GetUserByNamePathParamsType,
  GetUserByName200Type,
  GetUserByName400Type,
  GetUserByName404Type,
  GetUserByNameQueryResponseType,
} from '../ts/GetUserByNameType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { userSchema } from './userSchema.gen.ts'

export const getUserByNamePathParamsSchema = z.object({
  username: z.string().describe('The name that needs to be fetched. Use user1 for testing. '),
}) as unknown as ToZod<GetUserByNamePathParamsType>

export type GetUserByNamePathParamsSchema = GetUserByNamePathParamsType

/**
 * @description successful operation
 */
export const getUserByName200Schema = z.lazy(() => userSchema) as unknown as ToZod<GetUserByName200Type>

export type GetUserByName200Schema = GetUserByName200Type

/**
 * @description Invalid username supplied
 */
export const getUserByName400Schema = z.any() as unknown as ToZod<GetUserByName400Type>

export type GetUserByName400Schema = GetUserByName400Type

/**
 * @description User not found
 */
export const getUserByName404Schema = z.any() as unknown as ToZod<GetUserByName404Type>

export type GetUserByName404Schema = GetUserByName404Type

export const getUserByNameQueryResponseSchema = z.lazy(() => getUserByName200Schema) as unknown as ToZod<GetUserByNameQueryResponseType>

export type GetUserByNameQueryResponseSchema = GetUserByNameQueryResponseType
