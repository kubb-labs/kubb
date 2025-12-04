import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { AccountType } from '../models/ts/AccountType.ts'

export const accountTypeSchema = z.enum(['CHECKING', 'SAVING']) as unknown as ToZod<AccountType>

export type AccountTypeSchema = AccountType
