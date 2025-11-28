import type { ChequeDetailsResponse } from '../models/ts/ChequeDetailsResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { addressSchema } from './addressSchema.ts'
import { paymentDetailsTypeResponseSchema } from './paymentDetailsTypeResponseSchema.ts'
import { z } from 'zod'

export const chequeDetailsResponseSchema = z.object({
  type: z.lazy(() => paymentDetailsTypeResponseSchema),
  payment_instrument_id: z
    .string()
    .describe(
      'Payment Instrument ID that can be passed to the /transfers endpoint to trigger a transfer.\nThe type of the payment instrument dictates the method.\n',
    ),
  mailing_address: z.lazy(() => addressSchema).describe('Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).'),
  recipient_name: z.string(),
}) as unknown as ToZod<ChequeDetailsResponse>

export type ChequeDetailsResponseSchema = ChequeDetailsResponse
