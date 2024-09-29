import type { UserArray } from '../models/ts/UserArray.ts'
import { createUserFaker } from './createUserFaker.ts'
import { faker } from '@faker-js/faker'

export function createUserArrayFaker(data: NonNullable<Partial<UserArray>> = []) {
  return [...(faker.helpers.arrayElements([createUserFaker()]) as any), ...data]
}
