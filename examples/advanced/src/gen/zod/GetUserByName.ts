import zod from 'zod'

import { User } from './User'

export const GetUserByNameParams = zod.object({ username: zod.string().optional() })
export const GetUserByNameResponse = User
