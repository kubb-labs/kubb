import type { BrexCashAccountDetails } from '../models/ts/BrexCashAccountDetails.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { originatingAccountTypeSchema } from './originatingAccountTypeSchema.ts'
import { z } from 'zod'

export const brexCashAccountDetailsSchema = z.object({
  type: z.lazy(() => originatingAccountTypeSchema),
  id: z.string().describe('\nID of the Brex Business account: Can be found from the `/accounts` endpoint\nwhere instrument type is `CASH`.\n'),
}) as unknown as ToZod<BrexCashAccountDetails>

export type BrexCashAccountDetailsSchema = BrexCashAccountDetails
