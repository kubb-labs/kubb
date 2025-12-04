import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { InternationalWireDetailsResponse } from '../models/ts/InternationalWireDetailsResponse.ts'
import { addressSchema } from './addressSchema.ts'
import { paymentDetailsTypeResponseSchema } from './paymentDetailsTypeResponseSchema.ts'

export const internationalWireDetailsResponseSchema = z.object({
  type: z.lazy(() => paymentDetailsTypeResponseSchema),
  payment_instrument_id: z
    .string()
    .describe(
      'Payment Instrument ID that can be passed to the /transfers endpoint to trigger a transfer.\nThe type of the payment instrument dictates the method.\n',
    ),
  swift_code: z.string().describe("Counterparty's `SWIFT` code"),
  iban: z.string().describe("Counterparty's international bank account number"),
  beneficiary_bank_name: z.string().describe("Name of counterparty's bank").nullish(),
  address: z.lazy(() => addressSchema).describe('Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).'),
}) as unknown as ToZod<InternationalWireDetailsResponse>

export type InternationalWireDetailsResponseSchema = InternationalWireDetailsResponse
