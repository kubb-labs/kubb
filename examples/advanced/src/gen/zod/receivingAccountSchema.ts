import type { ReceivingAccount } from '../models/ts/ReceivingAccount.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { brexCashDetailsSchema } from './brexCashDetailsSchema.ts'
import { z } from 'zod'

/**
 * @description Receiving account details for the transfer
 */
export const receivingAccountSchema = z
  .lazy(() => brexCashDetailsSchema)
  .and(
    z.object({
      type: z.literal('BREX_CASH'),
    }),
  )
  .describe('Receiving account details for the transfer') as unknown as ToZod<ReceivingAccount>

export type ReceivingAccountSchema = ReceivingAccount
