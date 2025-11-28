import type { PaymentDetailsTypeRequest } from '../models/ts/PaymentDetailsTypeRequest.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const paymentDetailsTypeRequestSchema = z.enum(['ACH', 'DOMESTIC_WIRE', 'CHEQUE']) as unknown as ToZod<PaymentDetailsTypeRequest>

export type PaymentDetailsTypeRequestSchema = PaymentDetailsTypeRequest
