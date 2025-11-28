import type { VendorResponse } from '../models/ts/VendorResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { paymentAccountResponseSchema } from './paymentAccountResponseSchema.ts'
import { z } from 'zod'

export const vendorResponseSchema = z.object({
  id: z.string().describe('Vendor ID: Can be passed to /transfers endpoint to specify counterparty.\n'),
  company_name: z.string().nullish(),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  payment_accounts: z.array(z.lazy(() => paymentAccountResponseSchema)).nullish(),
}) as unknown as ToZod<VendorResponse>

export type VendorResponseSchema = VendorResponse
