import { faker } from '@faker-js/faker'
import type { AccountClass } from '../models/ts/AccountClass.ts'

export function createAccountClassFaker() {
  return faker.helpers.arrayElement<AccountClass>(['BUSINESS', 'PERSONAL'])
}
