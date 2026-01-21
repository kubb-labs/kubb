import { faker } from '@faker-js/faker'
import type { UserArray } from '../models/ts/UserArray.ts'
import { createUserFaker } from './createUserFaker.ts'

export function createUserArrayFaker(data?: UserArray) {
  return [...faker.helpers.multiple(() => createUserFaker()), ...(data || [])] as UserArray
}
