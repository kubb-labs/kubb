import { faker } from '@faker-js/faker'
import type { User } from '../models/ts/User.ts'
import { createTagTagFaker } from './tag/createTagFaker.ts'

export function createUserFaker(data?: Partial<User>): User {
  return {
    ...{
      id: faker.number.int(),
      username: faker.string.alpha(),
      uuid: faker.string.uuid(),
      tag: createTagTagFaker(),
      firstName: faker.string.alpha(),
      lastName: faker.string.alpha(),
      email: faker.internet.email(),
      password: faker.string.alpha(),
      phone: faker.string.alpha(),
      userStatus: faker.number.int(),
    },
    ...(data || {}),
  }
}
