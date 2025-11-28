import type { CounterPartyType } from '../models/ts/CounterPartyType.ts'
import { faker } from '@faker-js/faker'

export function createCounterPartyTypeFaker() {
  return faker.helpers.arrayElement<CounterPartyType>(['VENDOR', 'BOOK_TRANSFER'])
}
