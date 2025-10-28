import { z } from 'zod/v4'

export const loginUserQueryParamsSchema = z
  .object({
    username: z.optional(z.string().describe('The user name for login')),
    password: z.optional(z.string().describe('The password for login in clear text')),
  })
  .optional()

export type LoginUserQueryParamsSchema = z.infer<typeof loginUserQueryParamsSchema>

/**
 * @description successful operation
 */
export const loginUser200Schema = z.string()

export type LoginUser200Schema = z.infer<typeof loginUser200Schema>

/**
 * @description Invalid username/password supplied
 */
export const loginUser400Schema = z.any()

export type LoginUser400Schema = z.infer<typeof loginUser400Schema>

export const loginUserQueryResponseSchema = loginUser200Schema

export type LoginUserQueryResponseSchema = z.infer<typeof loginUserQueryResponseSchema>
