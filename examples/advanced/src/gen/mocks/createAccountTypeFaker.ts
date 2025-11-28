import type { AccountType } from '../models/ts/AccountType.ts'
import { faker } from '@faker-js/faker'

export function createAccountTypeFaker() {
  return faker.helpers.arrayElement<AccountType>(['CHECKING', 'SAVING'])
}
