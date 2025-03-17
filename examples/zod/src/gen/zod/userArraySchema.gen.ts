import type { UserArrayType } from '../ts/UserArrayType.ts'
import type { ToZod } from '@kubb/plugin-zod/utils'
import { z } from '../../zod.ts'
import { userSchema } from './userSchema.gen.ts'

export const userArraySchema = z.array(z.lazy(() => userSchema)) as unknown as ToZod<UserArrayType>

export type UserArraySchema = UserArrayType
