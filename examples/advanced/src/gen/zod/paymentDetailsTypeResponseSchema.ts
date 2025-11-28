import type { PaymentDetailsTypeResponse } from '../models/ts/PaymentDetailsTypeResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const paymentDetailsTypeResponseSchema = z.enum(['ACH', 'DOMESTIC_WIRE', 'CHEQUE', 'INTERNATIONAL_WIRE']) as unknown as ToZod<PaymentDetailsTypeResponse>

export type PaymentDetailsTypeResponseSchema = PaymentDetailsTypeResponse
