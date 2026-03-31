import * as z from 'zod'

export const deleteUserPathParamsSchema = z.object({
  username: z.string().describe('The name that needs to be deleted'),
})

export type DeleteUserPathParamsSchema = z.infer<typeof deleteUserPathParamsSchema>

export const deleteUser400Schema = z.any().describe('Invalid username supplied')

export type DeleteUser400Schema = z.infer<typeof deleteUser400Schema>

export const deleteUser404Schema = z.any().describe('User not found')

export type DeleteUser404Schema = z.infer<typeof deleteUser404Schema>

export const deleteUserMutationResponseSchema = z.any()

export type DeleteUserMutationResponseSchema = z.infer<typeof deleteUserMutationResponseSchema>

export const deleteUserMutationSchema = z.object({
  Response: z.any(),
  PathParams: deleteUserPathParamsSchema,
  Errors: z.union([deleteUser400Schema, deleteUser404Schema]),
})

export type DeleteUserMutationSchema = z.infer<typeof deleteUserMutationSchema>
