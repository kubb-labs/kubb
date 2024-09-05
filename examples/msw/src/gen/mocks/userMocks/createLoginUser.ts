import type { LoginUserQueryParams, LoginUser200, LoginUser400, LoginUserQueryResponse } from '../../models/LoginUser'
import { faker } from '@faker-js/faker'

export function createLoginUserQueryParams(data: NonNullable<Partial<LoginUserQueryParams>> = {}): NonNullable<LoginUserQueryParams> {
  faker.seed([220])
  return {
    ...{ username: faker.string.alpha(), password: faker.string.alpha() },
    ...data,
  }
}

/**
 * @description successful operation
 */
export function createLoginUser200(): NonNullable<LoginUser200> {
  faker.seed([220])
  return faker.string.alpha()
}

/**
 * @description Invalid username/password supplied
 */
export function createLoginUser400(): NonNullable<LoginUser400> {
  faker.seed([220])
  return undefined
}

/**
 * @description successful operation
 */
export function createLoginUserQueryResponse(): NonNullable<LoginUserQueryResponse> {
  faker.seed([220])
  return faker.string.alpha()
}
