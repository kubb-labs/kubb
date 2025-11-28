import type { PaymentAccountResponse } from '../models/ts/PaymentAccountResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { paymentAccountDetailsResponseSchema } from './paymentAccountDetailsResponseSchema.ts'
import { z } from 'zod'

export const paymentAccountResponseSchema = z.object({
  details: z.lazy(() => paymentAccountDetailsResponseSchema),
}) as unknown as ToZod<PaymentAccountResponse>

export type PaymentAccountResponseSchema = PaymentAccountResponse
