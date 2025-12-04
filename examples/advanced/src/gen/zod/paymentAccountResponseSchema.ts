import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { PaymentAccountResponse } from '../models/ts/PaymentAccountResponse.ts'
import { paymentAccountDetailsResponseSchema } from './paymentAccountDetailsResponseSchema.ts'

export const paymentAccountResponseSchema = z.object({
  details: z.lazy(() => paymentAccountDetailsResponseSchema),
}) as unknown as ToZod<PaymentAccountResponse>

export type PaymentAccountResponseSchema = PaymentAccountResponse
