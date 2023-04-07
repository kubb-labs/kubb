import z from 'zod'

export const loginUserQueryParamsSchema = z.object({ username: z.string().optional(), password: z.string().optional() })

/**
 * @description successful operation
 */
export const loginUserResponseSchema = z.string()

/**
 * @description Invalid username/password supplied
 */
export const loginUser400Schema = z.any()
