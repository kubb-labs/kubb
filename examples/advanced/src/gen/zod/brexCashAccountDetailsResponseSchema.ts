import type { BrexCashAccountDetailsResponse } from '../models/ts/BrexCashAccountDetailsResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { originatingAccountResponseTypeSchema } from './originatingAccountResponseTypeSchema.ts'
import { z } from 'zod'

export const brexCashAccountDetailsResponseSchema = z.object({
  type: z.lazy(() => originatingAccountResponseTypeSchema),
  id: z.string().describe('\nID of the Brex Business account.\n'),
}) as unknown as ToZod<BrexCashAccountDetailsResponse>

export type BrexCashAccountDetailsResponseSchema = BrexCashAccountDetailsResponse
