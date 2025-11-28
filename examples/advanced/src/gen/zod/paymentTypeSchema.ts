import type { PaymentType } from '../models/ts/PaymentType.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { z } from 'zod'

export const paymentTypeSchema = z.enum(['ACH', 'DOMESTIC_WIRE', 'CHEQUE', 'INTERNATIONAL_WIRE', 'BOOK_TRANSFER']) as unknown as ToZod<PaymentType>

export type PaymentTypeSchema = PaymentType
