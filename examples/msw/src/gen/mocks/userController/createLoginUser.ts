import type { LoginUserQueryParams, LoginUserQueryResponse } from '../../models/LoginUser.ts'
import { faker } from '@faker-js/faker'

export function createLoginUserQueryParams(data?: Partial<LoginUserQueryParams>) {
  faker.seed([220])
  return {
    ...{ username: faker.string.alpha(), password: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createLoginUser200() {
  faker.seed([220])
  return faker.string.alpha()
}

/**
 * @description Invalid username/password supplied
 */
export function createLoginUser400() {
  faker.seed([220])
  return undefined
}

export function createLoginUserQueryResponse(data?: Partial<LoginUserQueryResponse>) {
  faker.seed([220])
  return faker.helpers.arrayElement<any>([createLoginUser200()]) || data
}
