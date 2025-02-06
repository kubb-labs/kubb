import type { LoginUserQueryParams, LoginUserQueryResponse } from '../../models/ts/userController/LoginUser.ts'
import { faker } from '@faker-js/faker'

export function createLoginUserQueryParamsFaker(data?: Partial<LoginUserQueryParams>): Partial<LoginUserQueryParams> {
  return {
    ...{ username: faker.string.alpha(), password: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createLoginUser200Faker() {
  return faker.string.alpha()
}

/**
 * @description Invalid username/password supplied
 */
export function createLoginUser400Faker() {
  return undefined
}

export function createLoginUserQueryResponseFaker(data?: Partial<LoginUserQueryResponse>): Partial<LoginUserQueryResponse> {
  return data || faker.helpers.arrayElement<any>([createLoginUser200Faker()])
}
