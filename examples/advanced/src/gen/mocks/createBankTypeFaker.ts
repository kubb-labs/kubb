import type { BankType } from '../models/ts/BankType.ts'
import { faker } from '@faker-js/faker'

export function createBankTypeFaker() {
  return faker.helpers.arrayElement<BankType>(['CHECKING', 'SAVING'])
}
