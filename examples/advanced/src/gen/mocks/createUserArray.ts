import { faker } from '@faker-js/faker'
import type { UserArray } from '../models/ts/UserArray'
import { createUser } from './createUser'

export function createUserArray(override: NonNullable<Partial<UserArray>> = []): NonNullable<UserArray> {
  return [...(faker.helpers.arrayElements([createUser()]) as any), ...override]
}
