import z from 'zod'

import { userSchema } from './userSchema'

export const createUsersWithListInputRequestSchema = z.array(userSchema)

/**
 * @description Successful operation
 */
export const createUsersWithListInputResponseSchema = userSchema
