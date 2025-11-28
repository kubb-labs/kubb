import type { PaymentAccountDetails } from '../models/ts/PaymentAccountDetails.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { ACHDetailsRequestSchema } from './ACHDetailsRequestSchema.ts'
import { chequeDetailsRequestSchema } from './chequeDetailsRequestSchema.ts'
import { domesticWireDetailsRequestSchema } from './domesticWireDetailsRequestSchema.ts'
import { z } from 'zod'

/**
 * @description Payment Instruments associated with the vendor.\nEach vendor can only have one payment account per payment instrument type. For instance, a vendor may have associated details for each of ACH, DOMESTIC_WIRE, and CHEQUE, but they cannot have 2 entries for ACH. If you modify a vendor\'s existing payment instrument type with new details, it will overwrite any previous data.\n
 */
export const paymentAccountDetailsSchema = z
  .union([
    z
      .lazy(() => domesticWireDetailsRequestSchema)
      .and(
        z.object({
          type: z.literal('DOMESTIC_WIRE'),
        }),
      ),
    z
      .lazy(() => ACHDetailsRequestSchema)
      .and(
        z.object({
          type: z.literal('ACH'),
        }),
      ),
    z
      .lazy(() => chequeDetailsRequestSchema)
      .and(
        z.object({
          type: z.literal('CHEQUE'),
        }),
      ),
  ])
  .describe(
    "Payment Instruments associated with the vendor.\nEach vendor can only have one payment account per payment instrument type. For instance, a vendor may have associated details for each of ACH, DOMESTIC_WIRE, and CHEQUE, but they cannot have 2 entries for ACH. If you modify a vendor's existing payment instrument type with new details, it will overwrite any previous data.\n",
  ) as unknown as ToZod<PaymentAccountDetails>

export type PaymentAccountDetailsSchema = PaymentAccountDetails
