import z from 'zod'

import { userSchema } from '../userSchema'

export const createUsersWithListInputRequestSchema = z.array(z.lazy(() => userSchema))

/**
 * @description Successful operation
 */
export const createUsersWithListInputResponseSchema = z.lazy(() => userSchema)
