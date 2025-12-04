import { faker } from '@faker-js/faker'
import type { CounterPartyBankDetails } from '../models/ts/CounterPartyBankDetails.ts'
import { createCounterPartyIncomingTransferTypeFaker } from './createCounterPartyIncomingTransferTypeFaker.ts'

export function createCounterPartyBankDetailsFaker(_data?: Partial<CounterPartyBankDetails>): CounterPartyBankDetails {
  return Object.assign({}, { type: createCounterPartyIncomingTransferTypeFaker(), id: faker.string.alpha() })
}
