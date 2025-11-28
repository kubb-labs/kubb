import type { Money } from '../models/ts/Money.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

/**
 * @description \nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n
 */
export const moneySchema = z
  .object({
    amount: z
      .number()
      .int()
      .describe(
        'The amount of money, in the smallest denomination of the currency indicated by currency. For example, when currency is USD, amount is in cents.',
      ),
    currency: z.string().default('USD').describe('The type of currency, in ISO 4217 format.').nullish(),
  })
  .describe(
    '\nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n',
  ) as unknown as ToZod<Money>

export type MoneySchema = Money
