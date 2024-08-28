import type { User } from '../models/ts/User'
import { z } from 'zod'

export const userSchema = z.object({
  id: z.number().optional(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  password: z.string().optional(),
  phone: z.string().optional(),
  userStatus: z.number().describe('User Status').optional(),
}) as z.ZodType<User>
