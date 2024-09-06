import { z } from 'zod'

export const loginUserQueryParamsSchema = z
  .object({
    username: z.string().describe('The user name for login').optional(),
    password: z.string().describe('The password for login in clear text').optional(),
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

/**
 * @description successful operation
 */
export const loginUserQueryResponseSchema = z.string()

export type LoginUserQueryResponseSchema = z.infer<typeof loginUserQueryResponseSchema>
