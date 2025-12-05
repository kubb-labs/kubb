import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { ReceivingAccount } from '../models/ts/ReceivingAccount.ts'
import { brexCashDetailsSchema } from './brexCashDetailsSchema.ts'

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
