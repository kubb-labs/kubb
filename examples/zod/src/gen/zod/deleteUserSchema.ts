import z from 'zod'

export const deleteUserPathParamsSchema = z.object({ username: z.string() })
export const deleteUserRequestSchema = z.any()
export const deleteUserResponseSchema = z.any()

/**
 * @description Invalid username supplied
 */
export const deleteUser400Schema = z.any()

/**
 * @description User not found
 */
export const deleteUser404Schema = z.any()
