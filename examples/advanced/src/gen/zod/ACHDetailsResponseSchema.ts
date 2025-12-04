import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { ACHDetailsResponse } from '../models/ts/ACHDetailsResponse.ts'
import { accountClassSchema } from './accountClassSchema.ts'
import { accountTypeSchema } from './accountTypeSchema.ts'
import { paymentDetailsTypeResponseSchema } from './paymentDetailsTypeResponseSchema.ts'

export const ACHDetailsResponseSchema = z.object({
  type: z.lazy(() => paymentDetailsTypeResponseSchema),
  payment_instrument_id: z
    .string()
    .describe(
      'Payment Instrument ID that can be passed to the /transfers endpoint to trigger a transfer.\nThe type of the payment instrument dictates the method.\n',
    ),
  routing_number: z.string(),
  account_number: z.string(),
  account_type: z.lazy(() => accountTypeSchema).nullish(),
  account_class: z.lazy(() => accountClassSchema).nullish(),
}) as unknown as ToZod<ACHDetailsResponse>

export type ACHDetailsResponseSchema = ACHDetailsResponse
