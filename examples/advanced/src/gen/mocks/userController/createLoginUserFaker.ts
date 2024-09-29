import type { LoginUserQueryParams } from '../../models/ts/userController/LoginUser.js'
import { faker } from '@faker-js/faker'

export function createLoginUserQueryParamsFaker(data: NonNullable<Partial<LoginUserQueryParams>> = {}) {
  return {
    ...{ username: faker.string.alpha(), password: faker.string.alpha() },
    ...data,
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

/**
 * @description successful operation
 */
export function createLoginUserQueryResponseFaker() {
  return faker.string.alpha()
}
