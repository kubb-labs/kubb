import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { User } from '../models/ts/User.ts'
import { tagTagSchema } from './tag/tagSchema.ts'

export const userSchema = z.object({
  id: z.optional(z.number().int()),
  username: z.optional(z.string()),
  uuid: z.optional(z.string().uuid()),
  tag: z.optional(z.lazy(() => tagTagSchema).describe('The active tag')),
  firstName: z.optional(z.string()),
  lastName: z.optional(z.string()),
  email: z.optional(z.string().email()),
  password: z.optional(z.string()),
  phone: z.optional(z.string()),
  userStatus: z.optional(z.number().int().describe('User Status')),
}) as unknown as ToZod<User>

export type UserSchema = User
