import { faker } from '@faker-js/faker'
import type { BankType } from '../models/ts/BankType.ts'

export function createBankTypeFaker() {
  return faker.helpers.arrayElement<BankType>(['CHECKING', 'SAVING'])
}
