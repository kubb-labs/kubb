import type { AccountClass } from '../models/ts/AccountClass.ts'
import { faker } from '@faker-js/faker'

export function createAccountClassFaker() {
  return faker.helpers.arrayElement<AccountClass>(['BUSINESS', 'PERSONAL'])
}
