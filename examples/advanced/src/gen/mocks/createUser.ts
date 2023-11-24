import { User } from '../models/ts/User'
import { faker } from '@faker-js/faker'

export function createUser(): NonNullable<User> {
  return {
    'id': faker.number.float({}),
    'username': faker.string.alpha(),
    'firstName': faker.person.firstName(),
    'lastName': faker.person.lastName(),
    'email': faker.internet.email(),
    'password': faker.internet.password(),
    'phone': faker.phone.number(),
    'userStatus': faker.number.float({}),
  }
}
