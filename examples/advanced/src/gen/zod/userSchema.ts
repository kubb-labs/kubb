import { z } from 'zod'

export const userSchema = z.object({
  id: z.number().int().optional(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  userStatus: z.number().int().describe('User Status').optional(),
})

export type UserSchema = z.infer<typeof userSchema>
