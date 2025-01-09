import type { LogoutUserError, LogoutUserQueryResponse } from '../../models/ts/userController/LogoutUser.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from 'zod'

/**
 * @description successful operation
 */
export const logoutUserErrorSchema = z.any() as unknown as ToZod<LogoutUserError>

export type LogoutUserErrorSchema = LogoutUserError

export const logoutUserQueryResponseSchema = z.any() as unknown as ToZod<LogoutUserQueryResponse>

export type LogoutUserQueryResponseSchema = LogoutUserQueryResponse
