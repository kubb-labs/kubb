import type { User } from '../models/ts/User.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { tagTagSchema } from './tag/tagSchema.ts'
import { z } from 'zod/v4'

export const userSchema = z.object({
  id: z.int().optional(),
  username: z.string().optional(),
  uuid: z.uuid().optional(),
  get tag() {
    return tagTagSchema.describe('The active tag').optional()
  },
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.email().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  userStatus: z.int().describe('User Status').optional(),
}) as unknown as ToZod<User>

export type UserSchema = User
