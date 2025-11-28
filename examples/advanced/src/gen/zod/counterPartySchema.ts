import type { CounterParty } from '../models/ts/CounterParty.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { bookTransferDetailsSchema } from './bookTransferDetailsSchema.ts'
import { vendorDetailsSchema } from './vendorDetailsSchema.ts'
import { z } from 'zod'

/**
 * @description Counterparty Details for the transfer
 */
export const counterPartySchema = z
  .union([
    z
      .lazy(() => bookTransferDetailsSchema)
      .and(
        z.object({
          type: z.literal('BOOK_TRANSFER'),
        }),
      ),
    z
      .lazy(() => vendorDetailsSchema)
      .and(
        z.object({
          type: z.literal('VENDOR'),
        }),
      ),
  ])
  .describe('Counterparty Details for the transfer') as unknown as ToZod<CounterParty>

export type CounterPartySchema = CounterParty
