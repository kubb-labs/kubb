import type { BrexCashDetails } from '../models/ts/BrexCashDetails.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { receivingAccountTypeSchema } from './receivingAccountTypeSchema.ts'
import { z } from 'zod'

export const brexCashDetailsSchema = z.object({
  type: z.lazy(() => receivingAccountTypeSchema),
  id: z
    .string()
    .describe(
      '\nID of the Brex business account: Can be found from the [List business accounts](/openapi/transactions_api/#operation/listAccounts) endpoint\n',
    ),
}) as unknown as ToZod<BrexCashDetails>

export type BrexCashDetailsSchema = BrexCashDetails
