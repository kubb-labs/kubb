import z from 'zod'

export const deleteUserPathParamsSchema = z.object({ username: z.string() })
export const deleteUserRequestSchema = z.any()
export const deleteUserResponseSchema = z.any()
