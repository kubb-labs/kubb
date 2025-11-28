import type { OriginatingAccountResponse } from '../models/ts/OriginatingAccountResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { brexCashAccountDetailsResponseSchema } from './brexCashAccountDetailsResponseSchema.ts'
import { z } from 'zod'

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
