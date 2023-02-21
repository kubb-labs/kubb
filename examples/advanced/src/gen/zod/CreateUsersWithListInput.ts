import zod from 'zod'

import { User } from './User'

export const CreateUsersWithListInputRequest = zod.array(User)
export const CreateUsersWithListInputResponse = User
