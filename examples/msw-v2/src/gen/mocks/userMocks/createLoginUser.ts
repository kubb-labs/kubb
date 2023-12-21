import { faker } from '@faker-js/faker'
import type { LoginUser400, LoginUserQueryParams, LoginUserQueryResponse } from '../../models/LoginUser'

/**
 * @description Invalid username/password supplied
 */

export function createLoginUser400(): NonNullable<LoginUser400> {
  faker.seed([220])
  return undefined
}

export function createLoginUserQueryParams(): NonNullable<LoginUserQueryParams> {
  faker.seed([220])
  return { 'username': faker.string.alpha(), 'password': faker.internet.password() }
}
/**
 * @description successful operation
 */

export function createLoginUserQueryResponse(): NonNullable<LoginUserQueryResponse> {
  faker.seed([220])
  return faker.string.alpha()
}
