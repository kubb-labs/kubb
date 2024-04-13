import { faker } from '@faker-js/faker'
import type { LoginUser200, LoginUser400, LoginUserQueryParams, LoginUserQueryResponse } from '../../models/ts/userController/LoginUser'

export function createLoginUserQueryParams(): NonNullable<LoginUserQueryParams> {
  return { username: faker.string.alpha(), password: faker.string.alpha() }
}

/**
 * @description successful operation
 */
export function createLoginUser200(): NonNullable<LoginUser200> {
  return faker.string.alpha()
}

/**
 * @description Invalid username/password supplied
 */
export function createLoginUser400(): NonNullable<LoginUser400> {
  return undefined
}

/**
 * @description successful operation
 */
export function createLoginUserQueryResponse(): NonNullable<LoginUserQueryResponse> {
  return faker.string.alpha()
}
