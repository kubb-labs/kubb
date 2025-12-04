import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { DomesticWireDetailsResponse } from '../models/ts/DomesticWireDetailsResponse.ts'
import { addressSchema } from './addressSchema.ts'
import { paymentDetailsTypeResponseSchema } from './paymentDetailsTypeResponseSchema.ts'

export const domesticWireDetailsResponseSchema = z.object({
  type: z.lazy(() => paymentDetailsTypeResponseSchema),
  payment_instrument_id: z
    .string()
    .describe(
      'Payment Instrument ID that can be passed to the /transfers endpoint to trigger a transfer.\nThe type of the payment instrument dictates the method.\n',
    ),
  routing_number: z.string(),
  account_number: z.string(),
  address: z.lazy(() => addressSchema).describe('Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).'),
}) as unknown as ToZod<DomesticWireDetailsResponse>

export type DomesticWireDetailsResponseSchema = DomesticWireDetailsResponse
