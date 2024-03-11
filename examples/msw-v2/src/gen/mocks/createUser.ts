import { faker } from '@faker-js/faker'
import type { User } from '../models/User'

export function createUser(override: NonNullable<Partial<User>> = {}): NonNullable<User> {
  faker.seed([220])
  return {
    ...{
      'id': faker.number.int({}),
      'username': faker.string.alpha(),
      'firstName': faker.person.firstName(),
      'lastName': faker.person.lastName(),
      'email': faker.internet.email(),
      'password': faker.internet.password(),
      'phone': faker.phone.number(),
      'userStatus': faker.number.int({}),
    },
    ...override,
  }
}
