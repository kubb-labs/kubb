import type { BankAccountDetailsResponse } from '../models/ts/BankAccountDetailsResponse.ts'
import type { ToZod } from '../.kubb/ToZod.ts'
import { beneficiaryBankSchema } from './beneficiaryBankSchema.ts'
import { counterPartyResponseTypeSchema } from './counterPartyResponseTypeSchema.ts'
import { z } from 'zod'

export const bankAccountDetailsResponseSchema = z.object({
  type: z.lazy(() => counterPartyResponseTypeSchema),
  routing_number: z
    .string()
    .describe('Routing number of a bank account (or SWIFT/BIC code for international transfer). For incoming cheques, this field might be null.')
    .nullish(),
  account_number: z
    .string()
    .describe('Account number of a bank account (or IBAN code for international transfer). For incoming cheques, this field might be null.')
    .nullish(),
  description: z.string().describe('Description of the transfer.').nullish(),
  beneficiary_bank: z
    .lazy(() => beneficiaryBankSchema)
    .and(z.any())
    .nullish(),
  fed_reference_number: z.string().describe('Fed reference number for incoming wires').nullish(),
  external_memo: z.string().describe('External Memo populated by the sender').nullish(),
}) as unknown as ToZod<BankAccountDetailsResponse>

export type BankAccountDetailsResponseSchema = BankAccountDetailsResponse
