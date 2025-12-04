import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { AccountClass } from '../models/ts/AccountClass.ts'

export const accountClassSchema = z.enum(['BUSINESS', 'PERSONAL']) as unknown as ToZod<AccountClass>

export type AccountClassSchema = AccountClass
