import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { PaymentDetailsTypeRequest } from '../models/ts/PaymentDetailsTypeRequest.ts'

export const paymentDetailsTypeRequestSchema = z.enum(['ACH', 'DOMESTIC_WIRE', 'CHEQUE']) as unknown as ToZod<PaymentDetailsTypeRequest>

export type PaymentDetailsTypeRequestSchema = PaymentDetailsTypeRequest
