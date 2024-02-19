import { faker } from '@faker-js/faker'
import type { LoginUser400, LoginUserQueryParams, LoginUserQueryResponse } from '../../models/ts/userController/LoginUser'

/**
 * @description Invalid username/password supplied
 */

export function createLoginUser400(override?: NonNullable<Partial<LoginUser400>>): NonNullable<LoginUser400> {
  return undefined
}

export function createLoginUserQueryParams(override: NonNullable<Partial<LoginUserQueryParams>> = {}): NonNullable<LoginUserQueryParams> {
  return {
    ...{ 'username': faker.string.alpha(), 'password': faker.internet.password() },
    ...override,
  }
}
/**
 * @description successful operation
 */

export function createLoginUserQueryResponse(override?: NonNullable<Partial<LoginUserQueryResponse>>): NonNullable<LoginUserQueryResponse> {
  return faker.string.alpha()
}
