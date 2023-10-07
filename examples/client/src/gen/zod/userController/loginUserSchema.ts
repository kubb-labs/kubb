import { z } from 'zod'

/**
 * @description Invalid username/password supplied
 */
export const loginUser400Schema = z.any()
export const loginUserQueryParamsSchema = z.object({
  username: z.string().describe(`The user name for login`).optional(),
  password: z.string().describe(`The password for login in clear text`).optional(),
})

/**
 * @description successful operation
 */
export const loginUserQueryResponseSchema = z.string()
