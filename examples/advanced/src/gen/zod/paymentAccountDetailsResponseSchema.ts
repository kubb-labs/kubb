import type { PaymentAccountDetailsResponse } from '../models/ts/PaymentAccountDetailsResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { ACHDetailsResponseSchema } from './ACHDetailsResponseSchema.ts'
import { chequeDetailsResponseSchema } from './chequeDetailsResponseSchema.ts'
import { domesticWireDetailsResponseSchema } from './domesticWireDetailsResponseSchema.ts'
import { internationalWireDetailsResponseSchema } from './internationalWireDetailsResponseSchema.ts'
import { z } from 'zod'

export const paymentAccountDetailsResponseSchema = z.union([
  z
    .lazy(() => domesticWireDetailsResponseSchema)
    .and(
      z.object({
        type: z.literal('DOMESTIC_WIRE'),
      }),
    ),
  z
    .lazy(() => ACHDetailsResponseSchema)
    .and(
      z.object({
        type: z.literal('ACH'),
      }),
    ),
  z
    .lazy(() => chequeDetailsResponseSchema)
    .and(
      z.object({
        type: z.literal('CHEQUE'),
      }),
    ),
  z
    .lazy(() => internationalWireDetailsResponseSchema)
    .and(
      z.object({
        type: z.literal('INTERNATIONAL_WIRE'),
      }),
    ),
]) as unknown as ToZod<PaymentAccountDetailsResponse>

export type PaymentAccountDetailsResponseSchema = PaymentAccountDetailsResponse
