import type { UserArray } from '../models/ts/UserArray.js'
import { createUserFaker } from './createUserFaker.js'
import { faker } from '@faker-js/faker'

export function createUserArrayFaker(data: NonNullable<Partial<UserArray>> = []) {
  return [...(faker.helpers.arrayElements([createUserFaker()]) as any), ...data]
}
