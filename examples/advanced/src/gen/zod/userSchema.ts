import * as z from 'zod'
import { tagTagSchema } from './tag/tagSchema.ts'

export const userSchema = z.object({
  id: z.int().optional(),
  username: z.string().optional(),
  uuid: z.uuid().optional(),
  tag: tagTagSchema.optional().describe('The active tag'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.email().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  userStatus: z.int().optional().describe('User Status'),
})

export type UserSchema = z.infer<typeof userSchema>
