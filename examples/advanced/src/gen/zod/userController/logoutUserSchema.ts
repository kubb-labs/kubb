import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { LogoutUserError, LogoutUserQueryResponse } from '../../models/ts/userController/LogoutUser.ts'

/**
 * @description successful operation
 */
export const logoutUserErrorSchema = z.any() as unknown as ToZod<LogoutUserError>

export type LogoutUserErrorSchema = LogoutUserError

export const logoutUserQueryResponseSchema = z.any() as unknown as ToZod<LogoutUserQueryResponse>

export type LogoutUserQueryResponseSchema = LogoutUserQueryResponse
