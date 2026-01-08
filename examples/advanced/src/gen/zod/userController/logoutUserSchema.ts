import type { LogoutUserStatusError, LogoutUserResponseData } from '../../models/ts/userController/LogoutUser.ts'
import type { ToZod } from '../../.kubb/ToZod.ts'
import { z } from 'zod'

/**
 * @description successful operation
 */
export const logoutUserStatusErrorSchema = z.any() as unknown as ToZod<LogoutUserStatusError>

export type LogoutUserStatusErrorSchema = LogoutUserStatusError

export const logoutUserResponseDataSchema = z.any() as unknown as ToZod<LogoutUserResponseData>

export type LogoutUserResponseDataSchema = LogoutUserResponseData
