import { z } from 'zod'

export const loginUserQueryParamsSchema = z
  .object({
    username: z.string().describe('The user name for login').optional(),
    password: z.string().describe('The password for login in clear text').optional(),
  })
  .optional()

/**
 * @description successful operation
 */
export const loginUser200Schema = z.string()

/**
 * @description Invalid username/password supplied
 */
export const loginUser400Schema = z.any()

export const loginUserQueryResponseSchema = z.lazy(() => loginUser200Schema)
