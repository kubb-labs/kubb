import type { AccountType } from '../models/ts/AccountType.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const accountTypeSchema = z.enum(['CHECKING', 'SAVING']) as unknown as ToZod<AccountType>

export type AccountTypeSchema = AccountType
