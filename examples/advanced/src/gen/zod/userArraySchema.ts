import type { UserArray } from '../models/ts/UserArray.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { userSchema } from './userSchema.ts'
import { z } from 'zod'

export const userArraySchema = z.array(userSchema) as unknown as ToZod<UserArray>

export type UserArraySchema = UserArray
