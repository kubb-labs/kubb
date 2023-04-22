import z from 'zod'

/**
 * @description Invalid username supplied
 */
export const deleteUser400Schema = z.any()

/**
 * @description User not found
 */
export const deleteUser404Schema = z.any()
export const deleteUserPathParamsSchema = z.object({ username: z.string() })
export const deleteUserResponseSchema = z.any()
