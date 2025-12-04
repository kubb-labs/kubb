import { faker } from '@faker-js/faker'
import type { AccountType } from '../models/ts/AccountType.ts'

export function createAccountTypeFaker() {
  return faker.helpers.arrayElement<AccountType>(['CHECKING', 'SAVING'])
}
