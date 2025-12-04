import { faker } from '@faker-js/faker'
import type { CounterPartyIncomingTransfer } from '../models/ts/CounterPartyIncomingTransfer.ts'
import { createCounterPartyBankDetailsFaker } from './createCounterPartyBankDetailsFaker.ts'

/**
 * @description Counterparty Details for the transfer
 */
export function createCounterPartyIncomingTransferFaker(data?: Partial<CounterPartyIncomingTransfer>): CounterPartyIncomingTransfer {
  return data || faker.helpers.arrayElement<any>([Object.assign({}, createCounterPartyBankDetailsFaker(), { type: 'BANK' })])
}
