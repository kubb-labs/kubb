import zod from 'zod'

import { userSchema } from './userSchema'

export const createUsersWithListInputRequestSchema = zod.array(userSchema)
export const createUsersWithListInputResponseSchema = userSchema
