import type { UpdateVendorRequest } from '../models/ts/UpdateVendorRequest.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { paymentAccountRequestSchema } from './paymentAccountRequestSchema.ts'
import { z } from 'zod'

export const updateVendorRequestSchema = z.object({
  company_name: z.string().describe('Name for vendor').nullish(),
  email: z.string().email().describe('Email for vendor').nullish(),
  phone: z.string().describe('Phone number for vendor').nullish(),
  payment_accounts: z
    .array(z.lazy(() => paymentAccountRequestSchema))
    .describe('To update payment instruments, we require the entire payload for each payment instrument that is being updated.\n')
    .nullish(),
  beneficiary_name: z.string().describe('Name for the Beneficiary').nullish(),
}) as unknown as ToZod<UpdateVendorRequest>

export type UpdateVendorRequestSchema = UpdateVendorRequest
