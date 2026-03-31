import * as z from 'zod'

export const logoutUserErrorSchema = z.any().describe('successful operation')

export type LogoutUserErrorSchema = z.infer<typeof logoutUserErrorSchema>

export const logoutUserQueryResponseSchema = z.any()

export type LogoutUserQueryResponseSchema = z.infer<typeof logoutUserQueryResponseSchema>

export const logoutUserQuerySchema = z.object({
  Response: z.any(),
  Errors: logoutUserErrorSchema,
})

export type LogoutUserQuerySchema = z.infer<typeof logoutUserQuerySchema>
