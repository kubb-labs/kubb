import { faker } from '@faker-js/faker'
import type { UserArray } from '../models/UserArray'
import { createUser } from './createUser'

export function createUserArray(override: NonNullable<Partial<UserArray>> = []): NonNullable<UserArray> {
  faker.seed([220])
  return [...(faker.helpers.arrayElements([createUser()]) as any), ...override]
}
