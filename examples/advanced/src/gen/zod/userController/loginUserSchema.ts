import type { LoginUserQueryParams, LoginUser200, LoginUser400, LoginUserQueryResponse } from '../../models/ts/userController/LoginUser.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

export const loginUserQueryParamsSchema = z
  .object({
    username: z.string().describe('The user name for login').optional(),
    password: z.string().describe('The password for login in clear text').optional(),
  } satisfies ToZod<LoginUserQueryParams>)
  .optional()

export type LoginUserQueryParamsSchema = LoginUserQueryParams

/**
 * @description successful operation
 */
export const loginUser200Schema = z.string()

export type LoginUser200Schema = LoginUser200

/**
 * @description Invalid username/password supplied
 */
export const loginUser400Schema = z.any()

export type LoginUser400Schema = LoginUser400

export const loginUserQueryResponseSchema = z.lazy(() => loginUser200Schema)

export type LoginUserQueryResponseSchema = LoginUserQueryResponse
