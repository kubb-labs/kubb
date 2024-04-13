import { faker } from '@faker-js/faker'
import type { User } from '../models/User'

export function createUser(data: NonNullable<Partial<User>> = {}): NonNullable<User> {
  faker.seed([220])
  return {
    ...{
      id: faker.number.int(),
      username: faker.string.alpha(),
      firstName: faker.string.alpha(),
      lastName: faker.string.alpha(),
      email: faker.string.alpha(),
      password: faker.string.alpha(),
      phone: faker.string.alpha(),
      userStatus: faker.number.int(),
    },
    ...data,
  }
}
