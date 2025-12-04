import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { BankConnection } from '../models/ts/BankConnection.ts'
import { balanceSchema } from './balanceSchema.ts'
import { bankDetailsSchema } from './bankDetailsSchema.ts'

export const bankConnectionSchema = z.object({
  id: z.string(),
  bank_details: z.lazy(() => bankDetailsSchema).and(z.any()),
  brex_account_id: z.string().describe('\nBrex business account ID\n').nullish(),
  last_four: z.string(),
  available_balance: z.lazy(() => balanceSchema).nullish(),
  current_balance: z.lazy(() => balanceSchema).nullish(),
}) as unknown as ToZod<BankConnection>

export type BankConnectionSchema = BankConnection
