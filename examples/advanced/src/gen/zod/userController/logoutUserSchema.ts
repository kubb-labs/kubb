import { z } from 'zod'
import type { ToZod } from '../../.kubb/ToZod.ts'
import type { LogoutUserResponseData, LogoutUserStatusError } from '../../models/ts/userController/LogoutUser.ts'

/**
 * @description successful operation
 */
export const logoutUserStatusErrorSchema = z.any() as unknown as ToZod<LogoutUserStatusError>

export type LogoutUserStatusErrorSchema = LogoutUserStatusError

export const logoutUserResponseDataSchema = z.any() as unknown as ToZod<LogoutUserResponseData>

export type LogoutUserResponseDataSchema = LogoutUserResponseData
