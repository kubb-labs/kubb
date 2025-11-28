import type { Balance } from '../models/ts/Balance.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { moneySchema } from './moneySchema.ts'
import { z } from 'zod'

export const balanceSchema = z.object({
  amount: z
    .lazy(() => moneySchema)
    .describe(
      '\nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n',
    ),
  as_of_date: z.string().date(),
}) as unknown as ToZod<Balance>

export type BalanceSchema = Balance
