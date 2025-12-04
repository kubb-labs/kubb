import { z } from 'zod'
import type { ToZod } from '../.kubb/ToZod.ts'
import type { CreateTransferRequest } from '../models/ts/CreateTransferRequest.ts'
import { approvalTypeSchema } from './approvalTypeSchema.ts'
import { counterPartySchema } from './counterPartySchema.ts'
import { moneySchema } from './moneySchema.ts'
import { originatingAccountSchema } from './originatingAccountSchema.ts'

export const createTransferRequestSchema = z.object({
  counterparty: z.lazy(() => counterPartySchema).describe('Counterparty Details for the transfer'),
  amount: z
    .lazy(() => moneySchema)
    .describe(
      '\nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n',
    ),
  description: z.string().describe('Description of the transfer for internal use. Not exposed externally.'),
  external_memo: z
    .string()
    .max(90)
    .describe(
      'External memo for the transfer. `Payment Instructions` for Wires and the `Entry Description` for ACH payments. \nMust be at most 90 characters for `ACH` and `WIRE` transactions\nand at most 40 characters for `CHEQUES`\n',
    ),
  originating_account: z.lazy(() => originatingAccountSchema).and(z.any()),
  approval_type: z.lazy(() => approvalTypeSchema).nullish(),
  is_ppro_enabled: z.optional(
    z
      .boolean()
      .describe(
        'When set to true, add Principal Protection (PPRO) to the transaction.\n PPRO means Brex will cover any fees charged by intemediary or receiving banks. PPRO charges will be billed separately\n in a monthly statement. PPRO is only available for international wire transactions.\n',
      ),
  ),
}) as unknown as ToZod<CreateTransferRequest>

export type CreateTransferRequestSchema = CreateTransferRequest
