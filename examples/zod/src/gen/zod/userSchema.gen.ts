import { z } from '../../zod.ts'

export const userSchema = z.object({
  id: z.int().optional(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  userStatus: z.int().describe('User Status').optional(),
})

export type UserSchema = z.infer<typeof userSchema>
