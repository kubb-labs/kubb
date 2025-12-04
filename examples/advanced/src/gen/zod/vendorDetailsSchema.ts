import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { VendorDetails } from '../models/ts/VendorDetails.ts'
import { counterPartyTypeSchema } from './counterPartyTypeSchema.ts'

export const vendorDetailsSchema = z.object({
  type: z.lazy(() => counterPartyTypeSchema),
  payment_instrument_id: z
    .string()
    .describe(
      "ID of the vendor's payment instrument: this will dictate the payment method and the\ncounterparty of the transaction.\nThe payment instrument ID is returned from the /vendors response and the type of the\ninstrument will dictate the payment method.\neg. Passing an instrument ID of type ACH will trigger an ACH payment to the associated vendor.\nSince a payment instrument can be updated while retaining the same payment_instrument_id, \nplease make sure to double check the details.\n",
    ),
}) as unknown as ToZod<VendorDetails>

export type VendorDetailsSchema = VendorDetails
