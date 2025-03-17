import type { LogoutUserErrorType, LogoutUserQueryResponseType } from '../ts/LogoutUserType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'

/**
 * @description successful operation
 */
export const logoutUserErrorSchema = z.any() as unknown as ToZod<LogoutUserErrorType>

export type LogoutUserErrorSchema = LogoutUserErrorType

export const logoutUserQueryResponseSchema = z.any() as unknown as ToZod<LogoutUserQueryResponseType>

export type LogoutUserQueryResponseSchema = LogoutUserQueryResponseType
