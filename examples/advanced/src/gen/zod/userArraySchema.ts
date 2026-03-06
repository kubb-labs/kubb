import * as z from 'zod'
import type { UserArray } from '../models/ts/UserArray.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { userSchema } from './userSchema.ts'

export const userArraySchema = z.array(z.lazy(() => userSchema)) as unknown as ToZod<UserArray>

export type UserArraySchema = UserArray
