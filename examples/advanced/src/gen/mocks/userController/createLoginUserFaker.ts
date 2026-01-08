import { faker } from '@faker-js/faker'
import type { LoginUserQueryParams, LoginUserResponseData } from '../../models/ts/userController/LoginUser.ts'

export function createLoginUserQueryParamsFaker(data?: Partial<LoginUserQueryParams>): LoginUserQueryParams {
  return {
    ...{ username: faker.string.alpha(), password: faker.string.alpha() },
    ...(data || {}),
  }
}

/**
 * @description successful operation
 */
export function createLoginUserStatus200Faker() {
  return faker.string.alpha()
}

/**
 * @description Invalid username/password supplied
 */
export function createLoginUserStatus400Faker() {
  return undefined
}

export function createLoginUserResponseDataFaker(data?: Partial<LoginUserResponseData>): LoginUserResponseData {
  return data || faker.helpers.arrayElement<any>([createLoginUserStatus200Faker()])
}
