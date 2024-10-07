import type { UserArray } from '../models/ts/UserArray.ts'
import { createUserFaker } from './createUserFaker.ts'
import { faker } from '@faker-js/faker'

export function createUserArrayFaker() {
  return faker.helpers.multiple(() => createUserFaker()) as any
}
