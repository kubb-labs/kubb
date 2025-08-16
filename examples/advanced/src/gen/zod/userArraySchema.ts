import type { UserArray } from '../models/ts/UserArray.ts'
import type { ToZod } from '@kubb/plugin-zod/utils/v4'
import { userSchema } from './userSchema.ts'
import { z } from 'zod/v4'

export const userArraySchema = z.array(userSchema) as unknown as ToZod<UserArray>

export type UserArraySchema = UserArray
