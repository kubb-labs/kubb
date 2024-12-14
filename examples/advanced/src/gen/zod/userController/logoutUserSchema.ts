import type { LogoutUserError, LogoutUserQueryResponse } from '../../models/ts/userController/LogoutUser.ts'
import { z } from 'zod'

/**
 * @description successful operation
 */
export const logoutUserErrorSchema = z.any()

export type LogoutUserErrorSchema = LogoutUserError

export const logoutUserQueryResponseSchema = z.any()

export type LogoutUserQueryResponseSchema = LogoutUserQueryResponse
