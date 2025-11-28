import type { ChequeDetailsRequest } from '../models/ts/ChequeDetailsRequest.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { addressSchema } from './addressSchema.ts'
import { paymentDetailsTypeRequestSchema } from './paymentDetailsTypeRequestSchema.ts'
import { z } from 'zod'

export const chequeDetailsRequestSchema = z.object({
  type: z.lazy(() => paymentDetailsTypeRequestSchema),
  mailing_address: z.lazy(() => addressSchema).describe('Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).'),
  recipient_name: z.string().max(40),
  beneficiary_name: z.string().nullish(),
}) as unknown as ToZod<ChequeDetailsRequest>

export type ChequeDetailsRequestSchema = ChequeDetailsRequest
