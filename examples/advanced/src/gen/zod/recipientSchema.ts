import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { Recipient } from '../models/ts/Recipient.ts'
import { recipientTypeSchema } from './recipientTypeSchema.ts'

export const recipientSchema = z.object({
  type: z
    .lazy(() => recipientTypeSchema)
    .describe(
      'Specifies the type of the recipient. \n`ACCOUNT_ID` is the ID of a Brex Business account.\n`PAYMENT_INSTRUMENT_ID` is the ID of Payment Instrument of the receiving Brex account.\n',
    ),
  id: z.string(),
}) as unknown as ToZod<Recipient>

export type RecipientSchema = Recipient
