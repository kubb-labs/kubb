import type { UserArray } from '../models/ts/UserArray.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { userSchema } from './userSchema.ts'
import { z } from 'zod'

export const userArraySchema = z.array(z.lazy(() => userSchema)) as unknown as ToZod<UserArray>

export type UserArraySchema = UserArray
