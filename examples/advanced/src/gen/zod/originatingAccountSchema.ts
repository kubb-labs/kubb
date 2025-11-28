import type { OriginatingAccount } from '../models/ts/OriginatingAccount.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { brexCashAccountDetailsSchema } from './brexCashAccountDetailsSchema.ts'
import { z } from 'zod'

/**
 * @description Originating account details for the transfer
 */
export const originatingAccountSchema = z
  .lazy(() => brexCashAccountDetailsSchema)
  .and(
    z.object({
      type: z.literal('BREX_CASH'),
    }),
  )
  .describe('Originating account details for the transfer') as unknown as ToZod<OriginatingAccount>

export type OriginatingAccountSchema = OriginatingAccount
