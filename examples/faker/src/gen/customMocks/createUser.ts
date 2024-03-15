import { faker } from '@faker-js/faker'
import type { User } from '../models/User'

export function createUser(override: NonNullable<Partial<User>> = {}): NonNullable<User> {
  return {
    ...{
      'id': faker.number.int(),
      'username': faker.string.alpha(),
      'firstName': faker.string.alpha(),
      'lastName': faker.string.alpha(),
      'email': faker.string.alpha(),
      'password': faker.string.alpha(),
      'phone': faker.string.alpha(),
      'userStatus': faker.number.int(),
      'nationalityCode': faker.helpers.arrayElement([faker.string.alpha(), faker.helpers.fromRegExp(new RegExp('^[A-Z]{2}$'))]),
    },
    ...override,
  }
}
