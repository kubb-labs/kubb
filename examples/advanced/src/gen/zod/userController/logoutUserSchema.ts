import { z } from 'zod/v4'

/**
 * @description successful operation
 */
export const logoutUserErrorSchema = z.unknown()

export type LogoutUserErrorSchema = z.infer<typeof logoutUserErrorSchema>

export const logoutUserQueryResponseSchema = z.undefined()

export type LogoutUserQueryResponseSchema = z.infer<typeof logoutUserQueryResponseSchema>
