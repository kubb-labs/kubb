import { faker } from '@faker-js/faker'
import type { LoginUser400, LoginUserQueryParams, LoginUserQueryResponse } from '../../models/LoginUser'

/**
 * @description Invalid username/password supplied
 */

export function createLoginUser400(override?: Partial<LoginUser400>): NonNullable<LoginUser400> {
  return undefined
}

export function createLoginUserQueryParams(override: Partial<LoginUserQueryParams> = {}): NonNullable<LoginUserQueryParams> {
  return {
    ...{ 'username': faker.string.alpha(), 'password': faker.internet.password() },
    ...override,
  }
}
/**
 * @description successful operation
 */

export function createLoginUserQueryResponse(override?: Partial<LoginUserQueryResponse>): NonNullable<LoginUserQueryResponse> {
  return faker.string.alpha()
}
