import type { CounterPartyBankDetails } from './CounterPartyBankDetails.ts'

/**
 * @description Counterparty Details for the transfer
 */
export type CounterPartyIncomingTransfer = CounterPartyBankDetails & {
  type: 'BANK'
}
