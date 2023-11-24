import { faker } from '@faker-js/faker'
import { LoginUser400, LoginUserQueryParams, LoginUserQueryResponse } from '../../models/ts/userController/LoginUser'

/**
 * @description Invalid username/password supplied
 */

export function createLoginUser400(): NonNullable<LoginUser400> {
  return undefined
}

export function createLoginUserQueryParams(): NonNullable<LoginUserQueryParams> {
  return { 'username': faker.string.alpha(), 'password': faker.internet.password() }
}
/**
 * @description successful operation
 */

export function createLoginUserQueryResponse(): NonNullable<LoginUserQueryResponse> {
  return faker.string.alpha()
}
