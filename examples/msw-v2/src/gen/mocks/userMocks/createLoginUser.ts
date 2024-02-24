import { faker } from '@faker-js/faker'
import type { LoginUser200, LoginUser400, LoginUserQueryParams, LoginUserQueryResponse } from '../../models/LoginUser'

/**
 * @description successful operation
 */

export function createLoginUser200(override?: NonNullable<Partial<LoginUser200>>): NonNullable<LoginUser200> {
  faker.seed([220])
  return faker.string.alpha()
}
/**
 * @description Invalid username/password supplied
 */

export function createLoginUser400(override?: NonNullable<Partial<LoginUser400>>): NonNullable<LoginUser400> {
  faker.seed([220])
  return undefined
}

export function createLoginUserQueryParams(override: NonNullable<Partial<LoginUserQueryParams>> = {}): NonNullable<LoginUserQueryParams> {
  faker.seed([220])
  return {
    ...{ 'username': faker.string.alpha(), 'password': faker.internet.password() },
    ...override,
  }
}
/**
 * @description successful operation
 */

export function createLoginUserQueryResponse(override?: NonNullable<Partial<LoginUserQueryResponse>>): NonNullable<LoginUserQueryResponse> {
  faker.seed([220])
  return faker.string.alpha()
}
