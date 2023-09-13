import { faker } from '@faker-js/faker'

import { createUser } from './createUser'
import { UserArray } from '../models/UserArray'

export function createUserArray(): UserArray {
  return faker.helpers.arrayElements([createUser()]) as any
}
