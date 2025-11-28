import type { CounterPartyIncomingTransferType } from '../models/ts/CounterPartyIncomingTransferType.ts'
import { faker } from '@faker-js/faker'

export function createCounterPartyIncomingTransferTypeFaker() {
  return faker.helpers.arrayElement<CounterPartyIncomingTransferType>(['BANK'])
}
