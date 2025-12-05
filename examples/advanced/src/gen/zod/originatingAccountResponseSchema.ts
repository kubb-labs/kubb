import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { OriginatingAccountResponse } from '../models/ts/OriginatingAccountResponse.ts'
import { brexCashAccountDetailsResponseSchema } from './brexCashAccountDetailsResponseSchema.ts'

/**
 * @description Originating account details for the transfer
 */
export const originatingAccountResponseSchema = z
  .lazy(() => brexCashAccountDetailsResponseSchema)
  .and(
    z.object({
      type: z.literal('BREX_CASH'),
    }),
  )
  .describe('Originating account details for the transfer') as unknown as ToZod<OriginatingAccountResponse>

export type OriginatingAccountResponseSchema = OriginatingAccountResponse
