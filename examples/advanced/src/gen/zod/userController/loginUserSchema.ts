import type { LoginUserQueryParams, LoginUser200, LoginUser400, LoginUserQueryResponse } from '../../models/ts/userController/LoginUser.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { z } from 'zod/v4'

export const loginUserQueryParamsSchema = z
  .object({
    username: z.string().describe('The user name for login').optional(),
    password: z.string().describe('The password for login in clear text').optional(),
  })
  .optional() as unknown as ToZod<LoginUserQueryParams>

export type LoginUserQueryParamsSchema = LoginUserQueryParams

/**
 * @description successful operation
 */
export const loginUser200Schema = z.string() as unknown as ToZod<LoginUser200>

export type LoginUser200Schema = LoginUser200

/**
 * @description Invalid username/password supplied
 */
export const loginUser400Schema = z.any() as unknown as ToZod<LoginUser400>

export type LoginUser400Schema = LoginUser400

export const loginUserQueryResponseSchema = loginUser200Schema as unknown as ToZod<LoginUserQueryResponse>

export type LoginUserQueryResponseSchema = LoginUserQueryResponse
