import type { Transfer } from '../models/ts/Transfer.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { counterPartyResponseSchema } from './counterPartyResponseSchema.ts'
import { moneySchema } from './moneySchema.ts'
import { originatingAccountResponseSchema } from './originatingAccountResponseSchema.ts'
import { paymentTypeSchema } from './paymentTypeSchema.ts'
import { transferCancellationReasonSchema } from './transferCancellationReasonSchema.ts'
import { transferStatusSchema } from './transferStatusSchema.ts'
import { z } from 'zod'

export const transferSchema = z.object({
  id: z.string().describe('Unique ID associated with the transfer'),
  counterparty: z.lazy(() => counterPartyResponseSchema).nullish(),
  description: z.string().describe('Description of the transfer').nullish(),
  payment_type: z.lazy(() => paymentTypeSchema),
  amount: z
    .lazy(() => moneySchema)
    .describe(
      '\nMoney fields can be signed or unsigned. Fields are signed (an unsigned value will be interpreted as positive). The amount of money will be represented in the smallest denomination\nof the currency indicated. For example, USD 7.00 will be represented in cents with an amount of 700.\n',
    ),
  process_date: z.string().date().describe('Transaction processing date').nullish(),
  originating_account: z.lazy(() => originatingAccountResponseSchema).describe('Originating account details for the transfer'),
  status: z
    .lazy(() => transferStatusSchema)
    .describe(
      '`PROCESSING`: We have started to process the sending or receiving of this transaction.\n`SCHEDULED`: The transaction is scheduled to enter the `PROCESSING` status.\n`PENDING_APPROVAL`: The transaction requires approval before it can enter the `SCHEDULED` or `PROCESSING` status.\n`FAILED`: A grouping of multiple terminal states that prevented the transaction from completing.\nThis includes a a user-cancellation, approval being denied, insufficient funds, failed verifications, etc.\n`PROCESSED`: The money movement has been fully completed, which could mean money sent has arrived.\n',
    ),
  cancellation_reason: z.lazy(() => transferCancellationReasonSchema).nullish(),
  estimated_delivery_date: z.string().date().describe('Estimated delivery date for transfer').nullish(),
  creator_user_id: z.string().describe('User ID of the transfer initiator').nullish(),
  created_at: z.string().date().describe('Date of transfer creation').nullish(),
  display_name: z.string().describe('Human readable name for the transaction').nullish(),
  external_memo: z
    .string()
    .max(90)
    .describe(
      'External memo for the transfer. `Payment Instructions` for Wires and the `Entry Description` for ACH payments. \nMust be at most 90 characters for `ACH` and `WIRE` transactions\nand at most 40 characters for `CHEQUES`\n',
    )
    .nullish(),
  is_ppro_enabled: z.boolean().describe('If Principal Protection (PPRO) is enabled').nullish(),
}) as unknown as ToZod<Transfer>

export type TransferSchema = Transfer
