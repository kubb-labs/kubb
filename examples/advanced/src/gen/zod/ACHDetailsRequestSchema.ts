import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { ACHDetailsRequest } from '../models/ts/ACHDetailsRequest.ts'
import { accountClassSchema } from './accountClassSchema.ts'
import { accountTypeSchema } from './accountTypeSchema.ts'
import { paymentDetailsTypeRequestSchema } from './paymentDetailsTypeRequestSchema.ts'

export const ACHDetailsRequestSchema = z.object({
  type: z.lazy(() => paymentDetailsTypeRequestSchema),
  routing_number: z.string().describe('The routing number must follow proper format.'),
  account_number: z.string(),
  account_type: z.lazy(() => accountTypeSchema),
  account_class: z.lazy(() => accountClassSchema),
  beneficiary_name: z.string().nullish(),
}) as unknown as ToZod<ACHDetailsRequest>

export type ACHDetailsRequestSchema = ACHDetailsRequest
