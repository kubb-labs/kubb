import { z } from 'zod/v4'

/**
 * @description successful operation
 */
export const logoutUserErrorSchema = z.any()

export type LogoutUserErrorSchema = z.infer<typeof logoutUserErrorSchema>

export const logoutUserQueryResponseSchema = z.any()

export type LogoutUserQueryResponseSchema = z.infer<typeof logoutUserQueryResponseSchema>
