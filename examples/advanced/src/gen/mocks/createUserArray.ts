import { faker } from '@faker-js/faker'

import { UserArray } from '../models/ts/UserArray'
import { createUser } from './createUser'

export function createUserArray(): NonNullable<UserArray> {
  return faker.helpers.arrayElements([createUser()]) as any
}
