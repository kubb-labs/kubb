import zod from 'zod'

import { User } from './User'

export const CreateUserRequest = User
export const CreateUserResponse = zod.any()
