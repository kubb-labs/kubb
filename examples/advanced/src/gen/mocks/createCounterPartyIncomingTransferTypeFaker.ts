import { faker } from '@faker-js/faker'
import type { CounterPartyIncomingTransferType } from '../models/ts/CounterPartyIncomingTransferType.ts'

export function createCounterPartyIncomingTransferTypeFaker() {
  return faker.helpers.arrayElement<CounterPartyIncomingTransferType>(['BANK'])
}
