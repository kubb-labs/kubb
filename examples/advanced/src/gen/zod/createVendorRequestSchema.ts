import type { CreateVendorRequest } from '../models/ts/CreateVendorRequest.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { paymentAccountRequestSchema } from './paymentAccountRequestSchema.ts'
import { z } from 'zod'

export const createVendorRequestSchema = z.object({
  company_name: z.string().describe('Name for vendor. The name must be unique.'),
  email: z.string().email().describe('Email for vendor.').nullish(),
  phone: z.string().describe('Phone number for vendor.').nullish(),
  payment_accounts: z
    .array(z.lazy(() => paymentAccountRequestSchema))
    .describe('Payment accounts associated with the vendor.')
    .nullish(),
}) as unknown as ToZod<CreateVendorRequest>

export type CreateVendorRequestSchema = CreateVendorRequest
