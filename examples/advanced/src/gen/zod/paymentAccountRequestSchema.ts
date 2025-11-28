import type { PaymentAccountRequest } from '../models/ts/PaymentAccountRequest.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { paymentAccountDetailsSchema } from './paymentAccountDetailsSchema.ts'
import { z } from 'zod'

export const paymentAccountRequestSchema = z.object({
  details: z
    .lazy(() => paymentAccountDetailsSchema)
    .describe(
      "Payment Instruments associated with the vendor.\nEach vendor can only have one payment account per payment instrument type. For instance, a vendor may have associated details for each of ACH, DOMESTIC_WIRE, and CHEQUE, but they cannot have 2 entries for ACH. If you modify a vendor's existing payment instrument type with new details, it will overwrite any previous data.\n",
    ),
}) as unknown as ToZod<PaymentAccountRequest>

export type PaymentAccountRequestSchema = PaymentAccountRequest
