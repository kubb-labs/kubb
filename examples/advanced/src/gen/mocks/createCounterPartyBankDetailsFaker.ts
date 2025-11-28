import type { CounterPartyBankDetails } from '../models/ts/CounterPartyBankDetails.ts'
import { createCounterPartyIncomingTransferTypeFaker } from './createCounterPartyIncomingTransferTypeFaker.ts'
import { faker } from '@faker-js/faker'

export function createCounterPartyBankDetailsFaker(data?: Partial<CounterPartyBankDetails>): CounterPartyBankDetails {
  return Object.assign({}, { type: createCounterPartyIncomingTransferTypeFaker(), id: faker.string.alpha() })
}
