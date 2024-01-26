import { z } from 'zod'
import type { User } from '../models/ts/User'

export const userSchema = z.object({
  'id': z.number().optional(),
  'username': z.string().optional(),
  'firstName': z.string().optional(),
  'lastName': z.string().optional(),
  'email': z.string().email().optional(),
  'password': z.string().optional(),
  'phone': z.string().optional(),
  'userStatus': z.number().describe(`User Status`).optional(),
}) as z.ZodType<User>
