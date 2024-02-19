import { z } from 'zod'
import { userSchema } from './userSchema'

export const createUsersWithListInputMutationRequestSchema = z.array(z.lazy(() => userSchema))

/**
 * @description Successful operation
 */
export const createUsersWithListInputMutationResponseSchema = z.lazy(() => userSchema)
