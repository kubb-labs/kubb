import type { DomesticWireDetailsRequest } from '../models/ts/DomesticWireDetailsRequest.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { addressSchema } from './addressSchema.ts'
import { paymentDetailsTypeRequestSchema } from './paymentDetailsTypeRequestSchema.ts'
import { z } from 'zod'

export const domesticWireDetailsRequestSchema = z.object({
  type: z.lazy(() => paymentDetailsTypeRequestSchema),
  routing_number: z.string().describe('The routing number must follow proper format.'),
  account_number: z.string(),
  address: z.lazy(() => addressSchema).describe('Company business address (must be in the US; no PO box or virtual/forwarding addresses allowed).'),
  beneficiary_name: z.string().nullish(),
}) as unknown as ToZod<DomesticWireDetailsRequest>

export type DomesticWireDetailsRequestSchema = DomesticWireDetailsRequest
