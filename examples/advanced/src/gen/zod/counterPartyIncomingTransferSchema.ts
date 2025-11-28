import type { CounterPartyIncomingTransfer } from '../models/ts/CounterPartyIncomingTransfer.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { counterPartyBankDetailsSchema } from './counterPartyBankDetailsSchema.ts'
import { z } from 'zod'

/**
 * @description Counterparty Details for the transfer
 */
export const counterPartyIncomingTransferSchema = z
  .lazy(() => counterPartyBankDetailsSchema)
  .and(
    z.object({
      type: z.literal('BANK'),
    }),
  )
  .describe('Counterparty Details for the transfer') as unknown as ToZod<CounterPartyIncomingTransfer>

export type CounterPartyIncomingTransferSchema = CounterPartyIncomingTransfer
