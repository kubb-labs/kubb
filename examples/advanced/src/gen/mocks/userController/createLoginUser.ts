import { faker } from '@faker-js/faker'
import type { LoginUser200, LoginUser400, LoginUserQueryParams, LoginUserQueryResponse } from '../../models/ts/userController/LoginUser'

export function createLoginUserQueryParams(override: NonNullable<Partial<LoginUserQueryParams>> = {}): NonNullable<LoginUserQueryParams> {
  return {
    ...{ username: faker.string.alpha(), password: faker.string.alpha() },
    ...override,
  }
}

/**
 * @description successful operation
 */
export function createLoginUser200(override?: NonNullable<Partial<LoginUser200>>): NonNullable<LoginUser200> {
  return faker.string.alpha()
}

/**
 * @description Invalid username/password supplied
 */
export function createLoginUser400(override?: NonNullable<Partial<LoginUser400>>): NonNullable<LoginUser400> {
  return undefined
}

/**
 * @description successful operation
 */
export function createLoginUserQueryResponse(override?: NonNullable<Partial<LoginUserQueryResponse>>): NonNullable<LoginUserQueryResponse> {
  return faker.string.alpha()
}
