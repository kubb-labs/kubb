import { z } from '../../zod.ts'

export const deleteUserPathParamsSchema = z.object({
  username: z.string().describe('The name that needs to be deleted'),
})

export type DeleteUserPathParamsSchema = z.infer<typeof deleteUserPathParamsSchema>

/**
 * @description Invalid username supplied
 */
export const deleteUser400Schema = z.any()

export type DeleteUser400Schema = z.infer<typeof deleteUser400Schema>

/**
 * @description User not found
 */
export const deleteUser404Schema = z.any()

export type DeleteUser404Schema = z.infer<typeof deleteUser404Schema>

export const deleteUserMutationResponseSchema = z.any()

export type DeleteUserMutationResponseSchema = z.infer<typeof deleteUserMutationResponseSchema>
