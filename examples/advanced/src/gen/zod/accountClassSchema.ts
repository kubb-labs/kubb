import type { AccountClass } from '../models/ts/AccountClass.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const accountClassSchema = z.enum(['BUSINESS', 'PERSONAL']) as unknown as ToZod<AccountClass>

export type AccountClassSchema = AccountClass
