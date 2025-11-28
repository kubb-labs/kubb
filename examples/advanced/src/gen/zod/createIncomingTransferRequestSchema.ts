import type { CreateIncomingTransferRequest } from '../models/ts/CreateIncomingTransferRequest.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { counterPartyIncomingTransferSchema } from './counterPartyIncomingTransferSchema.ts'
import { moneySchema } from './moneySchema.ts'
import { receivingAccountSchema } from './receivingAccountSchema.ts'
import { z } from 'zod'

export const createIncomingTransferRequestSchema = z.object({
  counterparty: z.lazy(() => counterPartyIncomingTransferSchema).describe('Counterparty Details for the transfer'),
  receiving_account: z.lazy(() => receivingAccountSchema).describe('Receiving account details for the transfer'),
  amount: z
    .lazy(() => moneySchema)
    .describe(
      '\nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n',
    ),
  description: z.string().describe(' \nDescription of the transfer for internal use. Not exposed externally. \n'),
}) as unknown as ToZod<CreateIncomingTransferRequest>

export type CreateIncomingTransferRequestSchema = CreateIncomingTransferRequest
