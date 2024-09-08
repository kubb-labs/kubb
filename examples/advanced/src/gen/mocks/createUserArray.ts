import type { UserArray } from '../models/ts/UserArray.ts'
import { createUser } from './createUser.ts'
import { faker } from '@faker-js/faker'

export function createUserArray(data: NonNullable<Partial<UserArray>> = []) {
  return [...(faker.helpers.arrayElements([createUser()]) as any), ...data]
}
