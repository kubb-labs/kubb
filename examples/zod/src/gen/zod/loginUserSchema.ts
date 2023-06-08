import { z } from 'zod'

/**
 * @description Invalid username/password supplied
 */
export const loginUser400Schema = z.any()
export const loginUserQueryParamsSchema = z.object({ username: z.string().optional(), password: z.string().optional() })

/**
 * @description successful operation
 */
export const loginUserQueryResponseSchema = z.string()
