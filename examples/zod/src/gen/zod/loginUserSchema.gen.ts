import type { LoginUserQueryParamsType, LoginUser200Type, LoginUser400Type, LoginUserQueryResponseType } from '../ts/LoginUserType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

export const loginUserQueryParamsSchema = z
  .object({
    username: z.string().describe('The user name for login').optional(),
    password: z.string().describe('The password for login in clear text').optional(),
  })
  .optional() as unknown as ToZod<LoginUserQueryParamsType>

export type LoginUserQueryParamsSchema = LoginUserQueryParamsType

/**
 * @description successful operation
 */
export const loginUser200Schema = z.string() as unknown as ToZod<LoginUser200Type>

export type LoginUser200Schema = LoginUser200Type

/**
 * @description Invalid username/password supplied
 */
export const loginUser400Schema = z.any() as unknown as ToZod<LoginUser400Type>

export type LoginUser400Schema = LoginUser400Type

export const loginUserQueryResponseSchema = z.lazy(() => loginUser200Schema) as unknown as ToZod<LoginUserQueryResponseType>

export type LoginUserQueryResponseSchema = LoginUserQueryResponseType
