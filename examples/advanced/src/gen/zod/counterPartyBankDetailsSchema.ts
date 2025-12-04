import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { CounterPartyBankDetails } from '../models/ts/CounterPartyBankDetails.ts'
import { counterPartyIncomingTransferTypeSchema } from './counterPartyIncomingTransferTypeSchema.ts'

export const counterPartyBankDetailsSchema = z.object({
  type: z.lazy(() => counterPartyIncomingTransferTypeSchema),
  id: z
    .string()
    .describe('\nThe financial account id: Can be found from the [List linked accounts](/openapi/payments_api/#operation/listLinkedAccounts) endpoint\n'),
}) as unknown as ToZod<CounterPartyBankDetails>

export type CounterPartyBankDetailsSchema = CounterPartyBankDetails
