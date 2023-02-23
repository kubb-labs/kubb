import zod from 'zod'

import { userSchema } from './userSchema'

export const createUserResponseSchema = zod.any()
export const createUserRequestSchema = userSchema
