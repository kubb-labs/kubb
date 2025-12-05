import { faker } from '@faker-js/faker'
import type { CounterPartyType } from '../models/ts/CounterPartyType.ts'

export function createCounterPartyTypeFaker() {
  return faker.helpers.arrayElement<CounterPartyType>(['VENDOR', 'BOOK_TRANSFER'])
}
