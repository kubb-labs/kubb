import z from 'zod'

export const loginUserPathParamsSchema = z.object({})
export const loginUserQueryParamsSchema = z.object({ username: z.string().optional(), password: z.string().optional() })

/**
 * @description successful operation
 */
export const loginUserResponseSchema = z.string()
