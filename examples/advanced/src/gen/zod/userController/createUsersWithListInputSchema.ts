import { z } from 'zod'
import { userSchema } from '../userSchema'

/**
 * @description successful operation
 */
export const createUsersWithListInputErrorSchema = z.any()

/**
 * @description Successful operation
 */
export const createUsersWithListInput200Schema = z.lazy(() => userSchema)
export const createUsersWithListInputMutationRequestSchema = z.array(z.lazy(() => userSchema))

/**
 * @description Successful operation
 */
export const createUsersWithListInputMutationResponseSchema = z.lazy(() => userSchema)
