import { z } from 'zod'

/**
 * @description Invalid username supplied
 */
export const deleteUser400Schema = z.any()

/**
 * @description User not found
 */
export const deleteUser404Schema = z.any()
export const deleteUserMutationResponseSchema = z.any()
export const deleteUserPathParamsSchema = z.object({ 'username': z.string().describe(`The name that needs to be deleted`) })
