import type { CounterPartyResponseType } from '../models/ts/CounterPartyResponseType.ts'
import { faker } from '@faker-js/faker'

export function createCounterPartyResponseTypeFaker() {
  return faker.helpers.arrayElement<CounterPartyResponseType>(['VENDOR', 'BOOK_TRANSFER', 'BANK_ACCOUNT'])
}
