import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { LoginUserQueryParams, LoginUserResponseData, LoginUserStatus200, LoginUserStatus400 } from '../../models/ts/userController/LoginUser.ts'

export const loginUserQueryParamsSchema = z
  .object({
    username: z.optional(z.string().describe('The user name for login')),
    password: z.optional(z.string().describe('The password for login in clear text')),
  })
  .optional() as unknown as ToZod<LoginUserQueryParams>

export type LoginUserQueryParamsSchema = LoginUserQueryParams

/**
 * @description successful operation
 */
export const loginUserStatus200Schema = z.string() as unknown as ToZod<LoginUserStatus200>

export type LoginUserStatus200Schema = LoginUserStatus200

/**
 * @description Invalid username/password supplied
 */
export const loginUserStatus400Schema = z.any() as unknown as ToZod<LoginUserStatus400>

export type LoginUserStatus400Schema = LoginUserStatus400

export const loginUserResponseDataSchema = z.lazy(() => loginUserStatus200Schema) as unknown as ToZod<LoginUserResponseData>

export type LoginUserResponseDataSchema = LoginUserResponseData
