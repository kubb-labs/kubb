import type { VendorDetailsResponse } from '../models/ts/VendorDetailsResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { counterPartyResponseTypeSchema } from './counterPartyResponseTypeSchema.ts'
import { z } from 'zod'

export const vendorDetailsResponseSchema = z.object({
  type: z.lazy(() => counterPartyResponseTypeSchema),
  payment_instrument_id: z.string(),
  id: z.string().describe('Vendor ID returned from `/vendors` endpoint'),
  routing_number: z.string().describe('Routing number of a bank account (or SWIFT/BIC code for international transfer).').nullish(),
  account_number: z.string().describe('Account number of a bank account (or IBAN code for international transfer).').nullish(),
}) as unknown as ToZod<VendorDetailsResponse>

export type VendorDetailsResponseSchema = VendorDetailsResponse
