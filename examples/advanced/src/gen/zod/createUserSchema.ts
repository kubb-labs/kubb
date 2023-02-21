import zod from 'zod'

import { userSchema } from './userSchema'

export const createUserRequestSchema = userSchema
export const createUserResponseSchema = zod.any()
