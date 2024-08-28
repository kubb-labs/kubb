import { z } from '../../zod.ts'
import { userSchema } from './userSchema.gen.ts'

export const getUserByNamePathParamsSchema = z.object({ username: z.string().describe('The name that needs to be fetched. Use user1 for testing. ') })

export type GetUserByNamePathParamsSchema = z.infer<typeof getUserByNamePathParamsSchema>

/**
 * @description successful operation
 */
export const getUserByName200Schema = z.lazy(() => userSchema)

export type GetUserByName200Schema = z.infer<typeof getUserByName200Schema>

/**
 * @description Invalid username supplied
 */
export const getUserByName400Schema = z.any()

export type GetUserByName400Schema = z.infer<typeof getUserByName400Schema>

/**
 * @description User not found
 */
export const getUserByName404Schema = z.any()

export type GetUserByName404Schema = z.infer<typeof getUserByName404Schema>

/**
 * @description successful operation
 */
export const getUserByNameQueryResponseSchema = z.lazy(() => userSchema)

export type GetUserByNameQueryResponseSchema = z.infer<typeof getUserByNameQueryResponseSchema>
