import type { UserArray } from '../models/UserArray.ts'
import { createUser } from './createUser.ts'
import { faker } from '@faker-js/faker'

export function createUserArray() {
  return faker.helpers.multiple(() => createUser()) as any
}
