import { z } from 'zod'

import { userSchema } from './userSchema'

/**
 * @description successful operation
 */
export const createUsersWithListInputErrorSchema = z.any()
export const createUsersWithListInputMutationRequestSchema = z.array(z.lazy(() => userSchema).schema)

/**
 * @description Successful operation
 */
export const createUsersWithListInputMutationResponseSchema = z.lazy(() => userSchema).schema
