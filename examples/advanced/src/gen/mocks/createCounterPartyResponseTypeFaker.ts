import { faker } from '@faker-js/faker'
import type { CounterPartyResponseType } from '../models/ts/CounterPartyResponseType.ts'

export function createCounterPartyResponseTypeFaker() {
  return faker.helpers.arrayElement<CounterPartyResponseType>(['VENDOR', 'BOOK_TRANSFER', 'BANK_ACCOUNT'])
}
